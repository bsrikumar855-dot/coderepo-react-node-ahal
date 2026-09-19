import { del, get, patch, post } from "../../shared/api/client.js";

export const collectionsApi = {
	list: (includeArchived) => get(`/collections${includeArchived ? "?includeArchived=true" : ""}`),
	create: (payload) => post("/collections", payload),
	update: (id, payload) => patch(`/collections/${id}`, payload),
	remove: (id) => del(`/collections/${id}`),
	archive: (id) => post(`/collections/${id}/archive`),
	unarchive: (id) => post(`/collections/${id}/unarchive`),
	listFolders: (collectionId) => get(`/collections/${collectionId}/folders`),
	createFolder: (collectionId, payload) => post(`/collections/${collectionId}/folders`, payload),
	removeFolder: (collectionId, folderId) => del(`/collections/${collectionId}/folders/${folderId}`),
};
