import { z } from "zod";
import { collectionService } from "./collection.service.js";

const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(500).default(""),
});

const updateSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	description: z.string().trim().max(500).optional(),
});

const createFolderSchema = z.object({
	collectionId: z.string().trim().min(1),
	parentFolderId: z.string().trim().min(1).nullable().optional(),
	name: z.string().trim().min(1).max(120),
});

const updateFolderSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	parentFolderId: z.string().trim().min(1).nullable().optional(),
});

export const collectionController = {
	async list(request, response, next) {
		try {
			const includeArchived = request.query.includeArchived === "true";
			const collections = await collectionService.list(request.account._id, { includeArchived });
			response.status(200).json({ data: collections });
		} catch (error) {
			next(error);
		}
	},

	async create(request, response, next) {
		try {
			const payload = createSchema.parse(request.body);
			const collection = await collectionService.create(request.account._id, payload);
			response.status(201).json({ data: collection });
		} catch (error) {
			next(error);
		}
	},

	async update(request, response, next) {
		try {
			const payload = updateSchema.parse(request.body);
			const collection = await collectionService.update(request.params.id, request.account._id, payload);
			response.status(200).json({ data: collection });
		} catch (error) {
			next(error);
		}
	},

	async archive(request, response, next) {
		try {
			const collection = await collectionService.setArchived(request.params.id, request.account._id, true);
			response.status(200).json({ data: collection });
		} catch (error) {
			next(error);
		}
	},

	async unarchive(request, response, next) {
		try {
			const collection = await collectionService.setArchived(request.params.id, request.account._id, false);
			response.status(200).json({ data: collection });
		} catch (error) {
			next(error);
		}
	},

	async remove(request, response, next) {
		try {
			await collectionService.delete(request.params.id, request.account._id);
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	},

	async listFolders(request, response, next) {
		try {
			const folders = await collectionService.listFolders(request.params.id, request.account._id);
			response.status(200).json({ data: folders });
		} catch (error) {
			next(error);
		}
	},

	async createFolder(request, response, next) {
		try {
			const payload = createFolderSchema.parse({ ...request.body, collectionId: request.params.id });
			const folder = await collectionService.createFolder(request.account._id, payload);
			response.status(201).json({ data: folder });
		} catch (error) {
			next(error);
		}
	},

	async updateFolder(request, response, next) {
		try {
			const payload = updateFolderSchema.parse(request.body);
			const folder = await collectionService.updateFolder(request.params.folderId, request.account._id, payload);
			response.status(200).json({ data: folder });
		} catch (error) {
			next(error);
		}
	},

	async removeFolder(request, response, next) {
		try {
			await collectionService.deleteFolder(request.params.folderId, request.account._id);
			response.status(204).send();
		} catch (error) {
			next(error);
		}
	},
};
