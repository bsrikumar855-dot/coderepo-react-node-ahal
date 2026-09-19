import { del, get, patch, post } from "../../shared/api/client.js";

export const environmentsApi = {
	list: () => get("/environments"),
	create: (payload) => post("/environments", payload),
	update: (id, payload) => patch(`/environments/${id}`, payload),
	remove: (id) => del(`/environments/${id}`),
	activate: (id) => post(`/environments/${id}/activate`),
};
