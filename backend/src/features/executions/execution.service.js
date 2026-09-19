import { AppError } from "../../shared/errors/app-error.js";
import { executionRepository } from "./execution.repository.js";
import { evaluateAssertions } from "./assertion-evaluator.js";
import { diagnoseExecution } from "./failure-diagnosis.js";

export const executionService = {
	/**
	 * Turns a raw executeRequestDefinition() result into a persisted execution record:
	 * evaluate assertions against it, classify the outcome, then write one document.
	 * Both the request-builder "Send" button and the workflow runner call this so every
	 * execution - standalone or part of a run - is diagnosed and stored identically.
	 */
	async recordExecution(ownerId, { source, requestId, requestSnapshot, environmentId, workflowRunId, stepIndex, result, assertions }) {
		const assertionOutcome = evaluateAssertions(assertions, result);
		const diagnosis = diagnoseExecution(result, assertionOutcome);

		const document = await executionRepository.create({
			ownerId,
			source,
			requestId: requestId || null,
			requestSnapshot,
			environmentId: environmentId || null,
			workflowRunId: workflowRunId || null,
			stepIndex: stepIndex ?? null,
			success: result.success,
			status: result.status,
			statusText: result.statusText,
			resolvedUrl: result.resolvedUrl,
			responseHeaders: result.responseHeaders,
			responseBody: result.responseBody,
			responseSize: result.responseSize,
			durationMs: result.durationMs,
			errorMessage: result.errorMessage,
			unresolvedVariables: result.unresolvedVariables,
			assertionResults: assertionOutcome.results,
			assertionsPassed: assertionOutcome.allPassed,
			diagnosis,
		});
		return document;
	},

	list(ownerId, options) {
		return executionRepository.listCursor(ownerId, options);
	},

	async get(id, ownerId) {
		const execution = await executionRepository.findById(id, ownerId);
		if (!execution) throw new AppError(404, "EXECUTION_NOT_FOUND", "This execution does not exist.");
		return execution;
	},

	async compare(idA, idB, ownerId) {
		const [a, b] = await Promise.all([this.get(idA, ownerId), this.get(idB, ownerId)]);
		return { a, b };
	},

	listByWorkflowRun(workflowRunId, ownerId) {
		return executionRepository.listByWorkflowRun(workflowRunId, ownerId);
	},
};
