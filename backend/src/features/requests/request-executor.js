import { buildVariableMap, resolveVariables } from "../../shared/utils/variables.js";

const MAX_RESPONSE_BODY_CHARS = 100_000;

function resolveEnabledPairs(pairs = [], namespaces) {
	const resolved = [];
	const unresolved = new Set();
	for (const pair of pairs) {
		if (!pair || pair.enabled === false || !pair.key) continue;
		const key = resolveVariables(pair.key, namespaces);
		const value = resolveVariables(pair.value ?? "", namespaces);
		key.unresolved.forEach((token) => unresolved.add(token));
		value.unresolved.forEach((token) => unresolved.add(token));
		resolved.push({ key: key.value, value: value.value });
	}
	return { resolved, unresolved };
}

function applyAuth(auth, headers, searchParams, namespaces) {
	if (!auth || auth.type === "none") return;
	if (auth.type === "bearer") {
		headers.set("Authorization", `Bearer ${resolveVariables(auth.token || "", namespaces).value}`);
		return;
	}
	if (auth.type === "basic") {
		const username = resolveVariables(auth.username || "", namespaces).value;
		const password = resolveVariables(auth.password || "", namespaces).value;
		headers.set("Authorization", `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);
		return;
	}
	if (auth.type === "api-key") {
		const name = resolveVariables(auth.apiKeyName || "", namespaces).value;
		const value = resolveVariables(auth.apiKeyValue || "", namespaces).value;
		if (!name) return;
		if (auth.apiKeyLocation === "query") searchParams.set(name, value);
		else headers.set(name, value);
	}
}

function buildBody(bodyType, bodyContent, headers, namespaces) {
	if (bodyType === "none" || !bodyContent) return undefined;
	const resolved = resolveVariables(bodyContent, namespaces).value;
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
 * Resolves environment and workflow variables (two separate namespaces - see
 * shared/utils/variables.js), applies auth, and executes an HTTP request definition.
 * Never throws for a target-side failure (network error, timeout, non-2xx status) -
 * those are captured as a structured result so the caller can persist and display
 * them. The result also carries `resolvedRequest`, the fully interpolated method,
 * URL, headers, and body that were actually sent, so the Execution Inspector can show
 * a step's real outbound request rather than just its {{template}} form. This may
 * contain live secret values (a resolved bearer token, an API key) - the caller is
 * responsible for masking those before persisting or returning the result; see
 * features/executions/execution-sanitizer.js.
 */
export async function executeRequestDefinition(definition, { environmentVariables = [], workflowVariables = {} } = {}, timeoutMs) {
	const namespaces = { workflowVariables, environmentVariables: buildVariableMap(environmentVariables) };
	const startedAt = Date.now();
	const unresolvedTokens = new Set();

	const urlResolution = resolveVariables(definition.url, namespaces);
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
			resolvedRequest: { method: definition.method, url: urlResolution.value, headers: {}, body: null },
			responseHeaders: {},
			responseBody: "",
			responseSize: 0,
			durationMs: Date.now() - startedAt,
			errorMessage: "The resolved URL is not valid. Check the base URL and any {{variables}} it depends on.",
			unresolvedVariables: [...unresolvedTokens],
		};
	}

	const { resolved: resolvedParams, unresolved: paramTokens } = resolveEnabledPairs(definition.params, namespaces);
	paramTokens.forEach((token) => unresolvedTokens.add(token));
	for (const param of resolvedParams) url.searchParams.set(param.key, param.value);

	const headers = new Headers();
	const { resolved: resolvedHeaders, unresolved: headerTokens } = resolveEnabledPairs(definition.headers, namespaces);
	headerTokens.forEach((token) => unresolvedTokens.add(token));
	for (const header of resolvedHeaders) headers.set(header.key, header.value);

	applyAuth(definition.auth, headers, url.searchParams, namespaces);
	const body = ["GET", "HEAD"].includes(definition.method) ? undefined : buildBody(definition.bodyType, definition.bodyContent, headers, namespaces);
	const resolvedRequest = { method: definition.method, url: url.toString(), headers: Object.fromEntries(headers.entries()), body: body ?? null };

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
			resolvedRequest,
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
			resolvedRequest,
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
