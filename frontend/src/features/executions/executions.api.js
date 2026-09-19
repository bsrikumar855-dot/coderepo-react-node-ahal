import { get, getPage } from "../../shared/api/client.js";

export const executionsApi = {
	list: ({ cursor, requestId, success } = {}) => {
		const params = new URLSearchParams();
		if (cursor) params.set("cursor", cursor);
		if (requestId) params.set("requestId", requestId);
		if (success !== undefined && success !== "") params.set("success", success);
		const query = params.toString();
		return getPage(`/executions${query ? `?${query}` : ""}`);
	},
	get: (id) => get(`/executions/${id}`),
	compare: (a, b) => get(`/executions/compare?a=${a}&b=${b}`),
};
