import { AppError } from "../../shared/errors/app-error.js";
import { environmentRepository } from "./environment.repository.js";

export const environmentService = {
	list(ownerId) {
		return environmentRepository.list(ownerId);
	},

	async create(ownerId, payload) {
		return environmentRepository.create(ownerId, payload);
	},

	async update(id, ownerId, updates) {
		const environment = await environmentRepository.update(id, ownerId, updates);
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "This environment does not exist.");
		return environment;
	},

	async delete(id, ownerId) {
		const environment = await environmentRepository.delete(id, ownerId);
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "This environment does not exist.");
		return environment;
	},

	async activate(id, ownerId) {
		const environment = await environmentRepository.activate(id, ownerId);
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "This environment does not exist.");
		return environment;
	},

	async resolveVariablesFor(ownerId, environmentId) {
		if (environmentId) {
			const environment = await environmentRepository.findById(environmentId, ownerId);
			if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "This environment does not exist.");
			return environment.variables;
		}
		const active = await environmentRepository.findActive(ownerId);
		return active ? active.variables : [];
	},
};
