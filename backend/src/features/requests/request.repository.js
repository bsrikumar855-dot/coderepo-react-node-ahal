import { RequestModel } from "./request.model.js";

export const requestRepository = {
	listByCollection(collectionId, ownerId, { folderId } = {}) {
		const filter = { collectionId, ownerId };
		if (folderId !== undefined) filter.folderId = folderId || null;
		return RequestModel.find(filter).sort({ updatedAt: -1 });
	},
	findById(id, ownerId) {
		return RequestModel.findOne({ _id: id, ownerId });
	},
	create(ownerId, payload) {
		return RequestModel.create({ ...payload, ownerId });
	},
	update(id, ownerId, updates) {
		return RequestModel.findOneAndUpdate({ _id: id, ownerId }, updates, { new: true, runValidators: true });
	},
	delete(id, ownerId) {
		return RequestModel.findOneAndDelete({ _id: id, ownerId });
	},
	deleteByCollection(collectionId, ownerId) {
		return RequestModel.deleteMany({ collectionId, ownerId });
	},
	deleteByFolderIds(folderIds, ownerId) {
		return RequestModel.deleteMany({ folderId: { $in: folderIds }, ownerId });
	},
	async search(ownerId, { query, method, tag } = {}) {
		const filter = { ownerId };
		if (method) filter.method = method;
		if (tag) filter.tags = tag;
		if (query) filter.$or = [{ name: new RegExp(escapeRegExp(query), "i") }, { url: new RegExp(escapeRegExp(query), "i") }];
		return RequestModel.find(filter).sort({ updatedAt: -1 }).limit(100);
	},
};

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
