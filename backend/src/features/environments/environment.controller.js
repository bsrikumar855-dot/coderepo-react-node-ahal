import { z } from "zod";
import { environmentService } from "./environment.service.js";

const variableSchema = z.object({
	key: z.string().trim().min(1).max(120),
	value: z.string().max(2000).nullable().default(""),
	enabled: z.boolean().default(true),
	secret: z.boolean().default(false),
});

const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	variables: z.array(variableSchema).default([]),
});

const updateSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	variables: z.array(variableSchema).optional(),
});

/**
 * Masks a secret-flagged variable's value before it ever leaves the API: the client
 * gets `value: null, hasValue: true` instead of the real value. This applies to every
 * environment response (list, create, update, activate) - "masked wherever displayed",
 * not just inside execution records. resolveVariablesFor() reads the unmasked
 * repository value directly, so request execution is unaffected.
 */
function maskEnvironment(environment) {
	const plain = typeof environment.toObject === "function" ? environment.toObject() : environment;
	return {
		...plain,
		variables: (plain.variables || []).map((variable) =>
			variable.secret ? { ...variable, value: null, hasValue: Boolean(variable.value) } : { ...variable, hasValue: Boolean(variable.value) },
		),
	};
}

export const environmentController = {
	async list(request, response, next) {
		try {
			const environments = await environmentService.list(request.account._id);
			response.status(200).json({ data: environments.map(maskEnvironment) });
		} catch (error) {
			next(error);
		}
	},

	async create(request, response, next) {
		try {
			const payload = createSchema.parse(request.body);
			const environment = await environmentService.create(request.account._id, payload);
			response.status(201).json({ data: maskEnvironment(environment) });
		} catch (error) {
			next(error);
		}
	},

	async update(request, response, next) {
		try {
			const payload = updateSchema.parse(request.body);
			const environment = await environmentService.update(request.params.id, request.account._id, payload);
			response.status(200).json({ data: maskEnvironment(environment) });
		} catch (error) {
			next(error);
		}
	},

	async remove(request, response, next) {
		try {
			await environmentService.delete(request.params.id, request.account._id);
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	},

	async activate(request, response, next) {
		try {
			const environment = await environmentService.activate(request.params.id, request.account._id);
			response.status(200).json({ data: maskEnvironment(environment) });
		} catch (error) {
			next(error);
		}
	},
};
