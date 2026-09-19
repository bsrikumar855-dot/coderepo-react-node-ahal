import { AppError } from "../../shared/errors/app-error.js";
import { getConfig } from "../../shared/config/index.js";
import { extractSecretValues } from "../../shared/utils/variables.js";
import { requestRepository } from "./request.repository.js";
import { collectionRepository } from "../collections/collection.repository.js";
import { environmentService } from "../environments/environment.service.js";
import { executeRequestDefinition } from "./request-executor.js";
import { executionService } from "../executions/execution.service.js";

export const requestService = {
	listByCollection(collectionId, ownerId, options) {
		return requestRepository.listByCollection(collectionId, ownerId, options);
	},

	search(ownerId, options) {
		return requestRepository.search(ownerId, options);
	},

	async get(id, ownerId) {
		const found = await requestRepository.findById(id, ownerId);
		if (!found) throw new AppError(404, "REQUEST_NOT_FOUND", "This request does not exist.");
		return found;
	},

	async create(ownerId, payload) {
		const collection = await collectionRepository.findById(payload.collectionId, ownerId);
		if (!collection) throw new AppError(404, "COLLECTION_NOT_FOUND", "This collection does not exist.");
		if (payload.folderId) {
			const folder = await collectionRepository.findFolderById(payload.folderId, ownerId);
			if (!folder || String(folder.collectionId) !== String(payload.collectionId)) {
				throw new AppError(400, "INVALID_FOLDER", "The folder does not belong to this collection.");
			}
		}
		return requestRepository.create(ownerId, payload);
	},

	async update(id, ownerId, updates) {
		const updated = await requestRepository.update(id, ownerId, updates);
		if (!updated) throw new AppError(404, "REQUEST_NOT_FOUND", "This request does not exist.");
		return updated;
	},

	async delete(id, ownerId) {
		const deleted = await requestRepository.delete(id, ownerId);
		if (!deleted) throw new AppError(404, "REQUEST_NOT_FOUND", "This request does not exist.");
		return { deleted: true };
	},

	/**
	 * Executes a saved request against a chosen (or active) environment, evaluates any
	 * assertions attached to it, records the outcome in execution history, and returns
	 * the full result. This is the single path both the request builder and workflow
	 * runner use, so history and diagnosis stay consistent everywhere a request runs.
	 * A standalone "Send" has no run-scope (workflow) variables of its own.
	 */
	async execute(id, ownerId, { environmentId, assertions } = {}) {
		const definition = await this.get(id, ownerId);
		const config = getConfig();
		const resolvedEnvironment = await environmentService.resolveVariablesFor(ownerId, environmentId);
		const secretValues = extractSecretValues(resolvedEnvironment.variables);
		const result = await executeRequestDefinition(
			definition.toObject(),
			{ environmentVariables: resolvedEnvironment.variables, workflowVariables: {} },
			config.requestExecutionTimeoutMs,
		);
		return executionService.recordExecution(ownerId, {
			source: "request",
			requestId: definition._id,
			requestSnapshot: { name: definition.name, method: definition.method, url: definition.url },
			environmentId: resolvedEnvironment.environmentId,
			result,
			assertions: assertions ?? [],
			secretValues,
		});
	},
};
