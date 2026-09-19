import { AppError } from "../../shared/errors/app-error.js";
import { collectionRepository } from "./collection.repository.js";
import { requestRepository } from "../requests/request.repository.js";

export const collectionService = {
	list(ownerId, options) {
		return collectionRepository.list(ownerId, options);
	},

	async create(ownerId, payload) {
		return collectionRepository.create(ownerId, payload);
	},

	async update(id, ownerId, updates) {
		const collection = await collectionRepository.update(id, ownerId, updates);
		if (!collection) throw new AppError(404, "COLLECTION_NOT_FOUND", "This collection does not exist.");
		return collection;
	},

	async setArchived(id, ownerId, archived) {
		const collection = await collectionRepository.setArchived(id, ownerId, archived);
		if (!collection) throw new AppError(404, "COLLECTION_NOT_FOUND", "This collection does not exist.");
		return collection;
	},

	async delete(id, ownerId) {
		const existing = await collectionRepository.findById(id, ownerId);
		if (!existing) throw new AppError(404, "COLLECTION_NOT_FOUND", "This collection does not exist.");
		const folderIds = await collectionRepository.deleteCascade(id, ownerId);
		await requestRepository.deleteByCollection(id, ownerId);
		if (folderIds.length) await requestRepository.deleteByFolderIds(folderIds, ownerId);
		return { deleted: true };
	},

	listFolders(collectionId, ownerId) {
		return collectionRepository.listFolders(collectionId, ownerId);
	},

	async createFolder(ownerId, payload) {
		const collection = await collectionRepository.findById(payload.collectionId, ownerId);
		if (!collection) throw new AppError(404, "COLLECTION_NOT_FOUND", "This collection does not exist.");
		if (payload.parentFolderId) {
			const parent = await collectionRepository.findFolderById(payload.parentFolderId, ownerId);
			if (!parent || String(parent.collectionId) !== String(payload.collectionId)) {
				throw new AppError(400, "INVALID_PARENT_FOLDER", "The parent folder does not belong to this collection.");
			}
		}
		return collectionRepository.createFolder(ownerId, payload);
	},

	async updateFolder(id, ownerId, updates) {
		const folder = await collectionRepository.updateFolder(id, ownerId, updates);
		if (!folder) throw new AppError(404, "FOLDER_NOT_FOUND", "This folder does not exist.");
		return folder;
	},

	async deleteFolder(id, ownerId) {
		const folder = await collectionRepository.findFolderById(id, ownerId);
		if (!folder) throw new AppError(404, "FOLDER_NOT_FOUND", "This folder does not exist.");
		await collectionRepository.deleteFolder(id, ownerId);
		await requestRepository.deleteByFolderIds([id], ownerId);
		return { deleted: true };
	},
};
