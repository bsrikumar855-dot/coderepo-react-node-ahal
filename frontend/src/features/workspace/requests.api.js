import { del, get, patch, post } from "../../shared/api/client.js";

export const requestsApi = {
	listByCollection: (collectionId, folderId) => get(`/requests/collection/${collectionId}${folderId !== undefined ? `?folderId=${folderId || "null"}` : ""}`),
	create: (payload) => post("/requests", payload),
	update: (id, payload) => patch(`/requests/${id}`, payload),
	remove: (id) => del(`/requests/${id}`),
	execute: (id, environmentId) => post(`/requests/${id}/execute`, { environmentId: environmentId || null }),
	searchAll: () => get("/requests/search"),
};
