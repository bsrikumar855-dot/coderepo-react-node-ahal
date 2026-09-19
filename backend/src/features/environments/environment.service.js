import { AppError } from "../../shared/errors/app-error.js";
import { environmentRepository } from "./environment.repository.js";

function normalizeIncomingVariables(variables, existingByKey) {
	return (variables || []).map((variable) => {
		// A secret variable's value comes back from the API as null (masked - see
		// maskEnvironment in the controller). If the client round-trips that null
		// untouched, keep the previously stored value instead of overwriting a real
		// secret with a blank one. A non-null value (including "") means the client
		// deliberately set or cleared it.
		if (variable.secret && (variable.value === null || variable.value === undefined)) {
			return { ...variable, value: existingByKey?.get(variable.key) ?? "" };
		}
		return { ...variable, value: variable.value ?? "" };
	});
}

export const environmentService = {
	list(ownerId) {
		return environmentRepository.list(ownerId);
	},

	async create(ownerId, payload) {
		const variables = normalizeIncomingVariables(payload.variables);
		return environmentRepository.create(ownerId, { ...payload, variables });
	},

	async update(id, ownerId, updates) {
		const patch = { ...updates };
		if (patch.variables) {
			const existing = await environmentRepository.findById(id, ownerId);
			if (!existing) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "This environment does not exist.");
			const existingByKey = new Map(existing.variables.map((variable) => [variable.key, variable.value]));
			patch.variables = normalizeIncomingVariables(patch.variables, existingByKey);
		}
		const environment = await environmentRepository.update(id, ownerId, patch);
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

	/**
	 * Returns the raw (unmasked) variables for a chosen or active environment, along
	 * with the environment's id so callers can record which environment an execution
	 * actually used - including when the caller didn't specify one and the active
	 * environment was used implicitly.
	 */
	async resolveVariablesFor(ownerId, environmentId) {
		if (environmentId) {
			const environment = await environmentRepository.findById(environmentId, ownerId);
			if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "This environment does not exist.");
			return { environmentId: String(environment._id), variables: environment.variables };
		}
		const active = await environmentRepository.findActive(ownerId);
		return { environmentId: active ? String(active._id) : null, variables: active ? active.variables : [] };
	},
};
