const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
let sessionToken = localStorage.getItem("ahal-session-token") || "";

export function setSessionToken(token) {
	sessionToken = token || "";
	if (sessionToken) localStorage.setItem("ahal-session-token", sessionToken);
	else localStorage.removeItem("ahal-session-token");
}

export const hasSessionToken = () => Boolean(sessionToken);

export async function request(path, options = {}) {
	const response = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
			...options.headers,
		},
	});
	if (response.status === 204) return null;
	const contentType = response.headers?.get?.("content-type") || "";
	const payload = contentType.includes("application/json") ? await response.json() : null;
	if (!response.ok) {
		const code = payload?.error?.code;
		const message = payload?.error?.message || `Ahal service returned ${response.status}.`;
		if (response.status === 401 && ["AUTH_REQUIRED", "INVALID_TOKEN", "ACCOUNT_UNAVAILABLE"].includes(code)) {
			setSessionToken("");
			window.dispatchEvent(new CustomEvent("ahal-session-expired", { detail: message }));
		}
		const error = new Error(message);
		error.code = code;
		error.details = payload?.error?.details;
		throw error;
	}
	if (!payload) return null;
	return { data: payload.data, meta: payload.meta };
}

export const get = (path) => request(path).then((result) => result?.data);
export const getPage = (path) => request(path);
export const post = (path, body) => request(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }).then((result) => result?.data);
export const patch = (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }).then((result) => result?.data);
export const del = (path) => request(path, { method: "DELETE" }).then((result) => result?.data);
