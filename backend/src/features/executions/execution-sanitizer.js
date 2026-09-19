const MASK = "••••••";

function redact(text, secretValues) {
	if (typeof text !== "string" || !secretValues.length) return text;
	return secretValues.reduce((acc, secret) => (secret ? acc.split(secret).join(MASK) : acc), text);
}

function redactHeaders(headers, secretValues) {
	if (!headers) return headers;
	const result = {};
	for (const [key, value] of Object.entries(headers)) result[key] = redact(String(value ?? ""), secretValues);
	return result;
}

/**
 * The one explicit point where secret environment-variable values are redacted from
 * a request-execution outcome. It runs after assertions and diagnosis are computed
 * against the real (unmasked) result - that business logic needs the truth - and
 * before anything is persisted to execution history or returned to the client.
 * Masking at the source (inside the request executor, or inside the environment
 * resolver) would mean every future consumer of a "raw" result has to remember to
 * redact it again themselves; a single seam here means there is exactly one place
 * this can be gotten wrong, and exactly one place to fix it.
 */
export function sanitizeExecutionResult(result, secretValues = []) {
	if (!secretValues.length) return result;
	return {
		...result,
		resolvedUrl: redact(result.resolvedUrl, secretValues),
		responseHeaders: redactHeaders(result.responseHeaders, secretValues),
		responseBody: redact(result.responseBody, secretValues),
		errorMessage: redact(result.errorMessage, secretValues),
		resolvedRequest: result.resolvedRequest
			? {
				  ...result.resolvedRequest,
				  url: redact(result.resolvedRequest.url, secretValues),
				  headers: redactHeaders(result.resolvedRequest.headers, secretValues),
				  body: redact(result.resolvedRequest.body, secretValues),
			  }
			: result.resolvedRequest,
	};
}

export function sanitizeAssertionResults(assertionResults = [], secretValues = []) {
	if (!secretValues.length) return assertionResults;
	return assertionResults.map((item) => ({
		...item,
		actual: typeof item.actual === "string" ? redact(item.actual, secretValues) : item.actual,
		message: redact(item.message, secretValues),
	}));
}
