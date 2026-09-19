import { z } from "zod";
import { workflowService } from "./workflow.service.js";

const stepSchema = z.object({
	requestId: z.string().trim().min(1),
	label: z.string().trim().max(120).default(""),
	extract: z
		.array(
			z.object({
				variableName: z.string().trim().min(1).max(120),
				path: z.string().trim().min(1).max(200),
			}),
		)
		.default([]),
	continueOnFailure: z.boolean().default(false),
});

const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(500).default(""),
	collectionId: z.string().trim().min(1).nullable().optional(),
	steps: z.array(stepSchema).default([]),
});

const updateSchema = createSchema.partial();

const runSchema = z.object({
	environmentId: z.string().trim().min(1).nullable().optional(),
});

export const workflowController = {
	async list(request, response, next) {
		try {
			const workflows = await workflowService.list(request.account._id);
			response.status(200).json({ data: workflows });
		} catch (error) {
			next(error);
		}
	},

	async create(request, response, next) {
		try {
			const payload = createSchema.parse(request.body);
			const workflow = await workflowService.create(request.account._id, payload);
			response.status(201).json({ data: workflow });
		} catch (error) {
			next(error);
		}
	},

	async update(request, response, next) {
		try {
			const payload = updateSchema.parse(request.body);
			const workflow = await workflowService.update(request.params.id, request.account._id, payload);
			response.status(200).json({ data: workflow });
		} catch (error) {
			next(error);
		}
	},

	async remove(request, response, next) {
		try {
			await workflowService.delete(request.params.id, request.account._id);
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	},

	async run(request, response, next) {
		try {
			const { environmentId } = runSchema.parse(request.body ?? {});
			const outcome = await workflowService.run(request.params.id, request.account._id, { environmentId });
			response.status(200).json({ data: outcome });
		} catch (error) {
			next(error);
		}
	},

	async listRuns(request, response, next) {
		try {
			const runs = await workflowService.listRuns(request.params.id, request.account._id);
			response.status(200).json({ data: runs });
		} catch (error) {
			next(error);
		}
	},

	async getRun(request, response, next) {
		try {
			const outcome = await workflowService.getRun(request.params.runId, request.account._id);
			response.status(200).json({ data: outcome });
		} catch (error) {
			next(error);
		}
	},
};
