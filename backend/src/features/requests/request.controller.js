import { z } from "zod";
import { requestService } from "./request.service.js";

const keyValueSchema = z.object({
	key: z.string().trim().default(""),
	value: z.string().default(""),
	enabled: z.boolean().default(true),
});

const authSchema = z.object({
	type: z.enum(["none", "bearer", "basic", "api-key"]).default("none"),
	token: z.string().default(""),
	username: z.string().default(""),
	password: z.string().default(""),
	apiKeyName: z.string().default(""),
	apiKeyValue: z.string().default(""),
	apiKeyLocation: z.enum(["header", "query"]).default("header"),
});

const assertionSchema = z.object({
	type: z.enum(["status", "header", "body", "responseTime"]),
	operator: z.enum(["equals", "notEquals", "contains", "exists", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"]),
	path: z.string().trim().max(200).optional(),
	key: z.string().trim().max(200).optional(),
	expected: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const baseFields = {
	name: z.string().trim().min(1).max(120),
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).default("GET"),
	url: z.string().trim().min(1).max(2000),
	params: z.array(keyValueSchema).max(100).default([]),
	headers: z.array(keyValueSchema).max(100).default([]),
	bodyType: z.enum(["none", "json", "text", "form-urlencoded"]).default("none"),
	bodyContent: z.string().max(50_000).default(""),
	auth: authSchema.default({}),
	tags: z.array(z.string().trim().max(40)).max(25).default([]),
	assertions: z.array(assertionSchema).max(50).default([]),
};

const createSchema = z.object({
	...baseFields,
	collectionId: z.string().trim().min(1),
	folderId: z.string().trim().min(1).nullable().optional(),
});

const updateSchema = z.object(
	Object.fromEntries(Object.entries(baseFields).map(([key, schema]) => [key, schema.optional()])),
).extend({
	folderId: z.string().trim().min(1).nullable().optional(),
});

const executeSchema = z.object({
	environmentId: z.string().trim().min(1).nullable().optional(),
});

export const requestController = {
	async listByCollection(request, response, next) {
		try {
			const folderId = request.query.folderId === "null" ? null : request.query.folderId;
			const results = await requestService.listByCollection(request.params.collectionId, request.account._id, { folderId });
			response.status(200).json({ data: results });
		} catch (error) {
			next(error);
		}
	},

	async search(request, response, next) {
		try {
			const { q, method, tag } = request.query;
			const results = await requestService.search(request.account._id, { query: q, method, tag });
			response.status(200).json({ data: results });
		} catch (error) {
			next(error);
		}
	},

	async create(request, response, next) {
		try {
			const payload = createSchema.parse(request.body);
			const created = await requestService.create(request.account._id, payload);
			response.status(201).json({ data: created });
		} catch (error) {
			next(error);
		}
	},

	async update(request, response, next) {
		try {
			const payload = updateSchema.parse(request.body);
			const updated = await requestService.update(request.params.id, request.account._id, payload);
			response.status(200).json({ data: updated });
		} catch (error) {
			next(error);
		}
	},

	async remove(request, response, next) {
		try {
			await requestService.delete(request.params.id, request.account._id);
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	},

	async execute(request, response, next) {
		try {
			const { environmentId } = executeSchema.parse(request.body ?? {});
			const saved = await requestService.get(request.params.id, request.account._id);
			const execution = await requestService.execute(request.params.id, request.account._id, {
				environmentId,
				assertions: saved.assertions,
			});
			response.status(200).json({ data: execution });
		} catch (error) {
			next(error);
		}
	},
};
