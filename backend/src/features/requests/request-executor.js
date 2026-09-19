import { buildVariableMap, resolveVariables } from "../../shared/utils/variables.js";

const MAX_RESPONSE_BODY_CHARS = 100_000;

function resolveEnabledPairs(pairs = [], variableMap) {
	const resolved = [];
	const unresolved = new Set();
	for (const pair of pairs) {
		if (!pair || pair.enabled === false || !pair.key) continue;
		const key = resolveVariables(pair.key, variableMap);
		const value = resolveVariables(pair.value ?? "", variableMap);
		key.unresolved.forEach((token) => unresolved.add(token));
		value.unresolved.forEach((token) => unresolved.add(token));
		resolved.push({ key: key.value, value: value.value });
	}
	return { resolved, unresolved };
}

function applyAuth(auth, headers, searchParams, variableMap) {
	if (!auth || auth.type === "none") return;
	if (auth.type === "bearer") {
		headers.set("Authorization", `Bearer ${resolveVariables(auth.token || "", variableMap).value}`);
		return;
	}
	if (auth.type === "basic") {
		const username = resolveVariables(auth.username || "", variableMap).value;
		const password = resolveVariables(auth.password || "", variableMap).value;
		headers.set("Authorization", `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);
		return;
	}
	if (auth.type === "api-key") {
		const name = resolveVariables(auth.apiKeyName || "", variableMap).value;
		const value = resolveVariables(auth.apiKeyValue || "", variableMap).value;
		if (!name) return;
		if (auth.apiKeyLocation === "query") searchParams.set(name, value);
		else headers.set(name, value);
	}
}

function buildBody(bodyType, bodyContent, headers, variableMap) {
	if (bodyType === "none" || !bodyContent) return undefined;
	const resolved = resolveVariables(bodyContent, variableMap).value;
	if (bodyType === "json") {
		if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
		return resolved;
	}
	if (bodyType === "text") {
		if (!headers.has("Content-Type")) headers.set("Content-Type", "text/plain");
		return resolved;
	}
	if (bodyType === "form-urlencoded") {
		if (!headers.has("Content-Type")) headers.set("Content-Type", "application/x-www-form-urlencoded");
		return resolved;
	}
	return undefined;
}

/**
 * Resolves environment variables, applies auth, and executes an HTTP request definition.
 * Never throws for a target-side failure (network error, timeout, non-2xx status) -
 * those are captured as a structured result so the caller can persist and display them.
 */
export async function executeRequestDefinition(definition, environmentVariables, timeoutMs) {
	const variableMap = buildVariableMap(environmentVariables);
	const startedAt = Date.now();
	const unresolvedTokens = new Set();

	const urlResolution = resolveVariables(definition.url, variableMap);
	urlResolution.unresolved.forEach((token) => unresolvedTokens.add(token));

	let url;
	try {
		url = new URL(urlResolution.value);
	} catch {
		return {
			success: false,
			status: null,
			statusText: null,
			resolvedUrl: urlResolution.value,
			responseHeaders: {},
			responseBody: "",
			responseSize: 0,
			durationMs: Date.now() - startedAt,
			errorMessage: "The resolved URL is not valid. Check the base URL and any {{variables}} it depends on.",
			unresolvedVariables: [...unresolvedTokens],
		};
	}

	const { resolved: resolvedParams, unresolved: paramTokens } = resolveEnabledPairs(definition.params, variableMap);
	paramTokens.forEach((token) => unresolvedTokens.add(token));
	for (const param of resolvedParams) url.searchParams.set(param.key, param.value);

	const headers = new Headers();
	const { resolved: resolvedHeaders, unresolved: headerTokens } = resolveEnabledPairs(definition.headers, variableMap);
	headerTokens.forEach((token) => unresolvedTokens.add(token));
	for (const header of resolvedHeaders) headers.set(header.key, header.value);

	applyAuth(definition.auth, headers, url.searchParams, variableMap);
	const body = ["GET", "HEAD"].includes(definition.method) ? undefined : buildBody(definition.bodyType, definition.bodyContent, headers, variableMap);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, { method: definition.method, headers, body, signal: controller.signal, redirect: "follow" });
		const rawBody = await response.text();
		const truncated = rawBody.length > MAX_RESPONSE_BODY_CHARS;
		const responseHeaders = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});
		return {
			success: true,
			status: response.status,
			statusText: response.statusText,
			resolvedUrl: url.toString(),
			responseHeaders,
			responseBody: truncated ? `${rawBody.slice(0, MAX_RESPONSE_BODY_CHARS)}\n...[truncated]` : rawBody,
			responseSize: Buffer.byteLength(rawBody),
			durationMs: Date.now() - startedAt,
			errorMessage: null,
			unresolvedVariables: [...unresolvedTokens],
		};
	} catch (error) {
		const timedOut = error.name === "AbortError";
		return {
			success: false,
			status: null,
			statusText: null,
			resolvedUrl: url.toString(),
			responseHeaders: {},
			responseBody: "",
			responseSize: 0,
			durationMs: Date.now() - startedAt,
			errorMessage: timedOut ? `The request timed out after ${timeoutMs}ms.` : error.message || "The request could not be completed.",
			unresolvedVariables: [...unresolvedTokens],
		};
	} finally {
		clearTimeout(timeout);
	}
}
