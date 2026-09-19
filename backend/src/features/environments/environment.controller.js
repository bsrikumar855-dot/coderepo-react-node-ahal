import { z } from "zod";
import { environmentService } from "./environment.service.js";

const variableSchema = z.object({
	key: z.string().trim().min(1).max(120),
	value: z.string().max(2000).default(""),
	enabled: z.boolean().default(true),
});

const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	variables: z.array(variableSchema).default([]),
});

const updateSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	variables: z.array(variableSchema).optional(),
});

export const environmentController = {
	async list(request, response, next) {
		try {
			const environments = await environmentService.list(request.account._id);
			response.status(200).json({ data: environments });
		} catch (error) {
			next(error);
		}
	},

	async create(request, response, next) {
		try {
			const payload = createSchema.parse(request.body);
			const environment = await environmentService.create(request.account._id, payload);
			response.status(201).json({ data: environment });
		} catch (error) {
			next(error);
		}
	},

	async update(request, response, next) {
		try {
			const payload = updateSchema.parse(request.body);
			const environment = await environmentService.update(request.params.id, request.account._id, payload);
			response.status(200).json({ data: environment });
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
			response.status(200).json({ data: environment });
		} catch (error) {
			next(error);
		}
	},
};
