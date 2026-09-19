/**
 * Deterministic failure classifier. This is the "deterministic core" that turns a raw
 * execution outcome into a stable, rule-based diagnosis - no external model call, no
 * heuristic scoring, just an ordered set of checks against fields the executor already
 * produced. Given the same inputs it always returns the same diagnosis, which is what
 * makes it something the frontend and any grading/verification step can rely on.
 */
export function diagnoseExecution(result, assertionOutcome) {
	if (!result.success) {
		if ((result.errorMessage || "").toLowerCase().includes("timed out")) {
			return {
				code: "TIMEOUT",
				title: "Request timed out",
				summary: "The target did not respond before the configured timeout elapsed.",
				suggestions: [
					"Confirm the target host is reachable from where this API runs.",
					"Raise REQUEST_EXECUTION_TIMEOUT_MS if the endpoint is expected to be slow.",
					"Check whether the request depends on a chain step that never completed.",
				],
			};
		}
		if ((result.errorMessage || "").toLowerCase().includes("resolved url is not valid")) {
			return {
				code: "INVALID_URL",
				title: "Resolved URL is invalid",
				summary: "After substituting {{variables}}, the URL could not be parsed.",
				suggestions: [
					"Check the active environment for a missing or malformed base-url variable.",
					"Look for a literal {{token}} left over from an unresolved variable.",
				],
			};
		}
		return {
			code: "NETWORK_ERROR",
			title: "Network request failed",
			summary: result.errorMessage || "The request could not reach its target.",
			suggestions: [
				"Verify the host and port are correct and the service is running.",
				"If this environment restricts outbound network access, point the request at the local mock target instead.",
			],
		};
	}

	if (result.unresolvedVariables?.length) {
		return {
			code: "UNRESOLVED_VARIABLES",
			title: "Request sent with unresolved variables",
			summary: `The request executed, but {{${result.unresolvedVariables.join("}}, {{")}}} were never substituted.`,
			suggestions: [
				"Add the missing keys to the active environment.",
				"Check for a typo between the request and the environment's variable names.",
			],
		};
	}

	if (result.status >= 500) {
		return {
			code: "SERVER_ERROR",
			title: `Target returned a server error (${result.status})`,
			summary: "The request reached the target, which failed while handling it.",
			suggestions: ["Inspect the response body for the target's own error details.", "Retry - this class of failure is often transient."],
		};
	}

	if (result.status === 401 || result.status === 403) {
		return {
			code: "AUTH_ERROR",
			title: `Target rejected the request's credentials (${result.status})`,
			summary: "The target considered this request unauthenticated or unauthorized.",
			suggestions: [
				"Check the request's auth configuration (bearer token, basic credentials, or API key) against what the target expects.",
				"Confirm the {{variable}} an auth field depends on resolved to the right value, not a stale or empty one.",
			],
		};
	}

	if (result.status >= 400) {
		return {
			code: "CLIENT_ERROR",
			title: `Target rejected the request (${result.status})`,
			summary: "The target considered this request invalid.",
			suggestions: [
				"Compare the request body, params, and headers with the target's documented contract.",
				"Check for a required field that was left empty after variable resolution.",
			],
		};
	}

	if (assertionOutcome && !assertionOutcome.allPassed) {
		const failed = assertionOutcome.results.filter((item) => !item.passed);
		return {
			code: "ASSERTION_FAILED",
			title: `${failed.length} of ${assertionOutcome.results.length} assertion(s) failed`,
			summary: failed.map((item) => item.message || `${item.type} ${item.operator} check failed`).join(" "),
			suggestions: ["Open the assertion tab to see expected vs. actual for each failed check."],
		};
	}

	return {
		code: "SUCCESS",
		title: "Request succeeded",
		summary: `Received a ${result.status} response with all checks passing.`,
		suggestions: [],
	};
}
