import { del, get, patch, post } from "../../shared/api/client.js";

export const workflowsApi = {
	list: () => get("/workflows"),
	create: (payload) => post("/workflows", payload),
	update: (id, payload) => patch(`/workflows/${id}`, payload),
	remove: (id) => del(`/workflows/${id}`),
	run: (id, environmentId) => post(`/workflows/${id}/run`, { environmentId: environmentId || null }),
	listRuns: (id) => get(`/workflows/${id}/runs`),
	getRun: (id, runId) => get(`/workflows/${id}/runs/${runId}`),
};
