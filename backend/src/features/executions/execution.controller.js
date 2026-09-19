import { z } from "zod";
import { executionService } from "./execution.service.js";

const listSchema = z.object({
	cursor: z.string().trim().optional(),
	limit: z.string().trim().optional(),
	requestId: z.string().trim().optional(),
	success: z.enum(["true", "false"]).optional(),
});

const compareSchema = z.object({
	a: z.string().trim().min(1),
	b: z.string().trim().min(1),
});

export const executionController = {
	async list(request, response, next) {
		try {
			const query = listSchema.parse(request.query);
			const page = await executionService.list(request.account._id, query);
			response.status(200).json({ data: page.items, meta: { nextCursor: page.nextCursor } });
		} catch (error) {
			next(error);
		}
	},

	async get(request, response, next) {
		try {
			const execution = await executionService.get(request.params.id, request.account._id);
			response.status(200).json({ data: execution });
		} catch (error) {
			next(error);
		}
	},

	async compare(request, response, next) {
		try {
			const { a, b } = compareSchema.parse(request.query);
			const comparison = await executionService.compare(a, b, request.account._id);
			response.status(200).json({ data: comparison });
		} catch (error) {
			next(error);
		}
	},
};
