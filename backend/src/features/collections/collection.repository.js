import { CollectionModel } from "./collection.model.js";
import { FolderModel } from "./folder.model.js";

export const collectionRepository = {
	list(ownerId, { includeArchived = false } = {}) {
		const filter = { ownerId };
		if (!includeArchived) filter.archivedAt = null;
		return CollectionModel.find(filter).sort({ updatedAt: -1 });
	},
	findById(id, ownerId) {
		return CollectionModel.findOne({ _id: id, ownerId });
	},
	create(ownerId, { name, description }) {
		return CollectionModel.create({ ownerId, name, description });
	},
	update(id, ownerId, updates) {
		return CollectionModel.findOneAndUpdate({ _id: id, ownerId }, updates, { new: true, runValidators: true });
	},
	setArchived(id, ownerId, archived) {
		return CollectionModel.findOneAndUpdate({ _id: id, ownerId }, { archivedAt: archived ? new Date() : null }, { new: true });
	},
	async deleteCascade(id, ownerId) {
		const folders = await FolderModel.find({ collectionId: id, ownerId }, { _id: 1 });
		await FolderModel.deleteMany({ collectionId: id, ownerId });
		await CollectionModel.deleteOne({ _id: id, ownerId });
		return folders.map((folder) => folder._id);
	},
	listFolders(collectionId, ownerId) {
		return FolderModel.find({ collectionId, ownerId }).sort({ name: 1 });
	},
	findFolderById(id, ownerId) {
		return FolderModel.findOne({ _id: id, ownerId });
	},
	createFolder(ownerId, { collectionId, parentFolderId, name }) {
		return FolderModel.create({ ownerId, collectionId, parentFolderId: parentFolderId || null, name });
	},
	updateFolder(id, ownerId, updates) {
		return FolderModel.findOneAndUpdate({ _id: id, ownerId }, updates, { new: true, runValidators: true });
	},
	deleteFolder(id, ownerId) {
		return FolderModel.findOneAndDelete({ _id: id, ownerId });
	},
	findDescendantFolderIds(collectionId, ownerId) {
		return FolderModel.find({ collectionId, ownerId }, { _id: 1 });
	},
};
