import { AppError } from "../../shared/errors/app-error.js";
import { executionRepository } from "./execution.repository.js";
import { evaluateAssertions } from "./assertion-evaluator.js";
import { diagnoseExecution } from "./failure-diagnosis.js";
import { sanitizeAssertionResults, sanitizeExecutionResult } from "./execution-sanitizer.js";

export const executionService = {
	/**
	 * Turns a raw executeRequestDefinition() result into a persisted execution record:
	 * evaluate assertions against it, classify the outcome, then write one document.
	 * Both the request-builder "Send" button and the workflow runner call this so every
	 * execution - standalone or part of a run - is diagnosed and stored identically.
	 *
	 * Assertions and diagnosis are computed from the raw result (they need the real
	 * response to be correct). `secretValues` - the live values of any secret-flagged
	 * environment variables used to build this request - are then redacted from
	 * everything that gets persisted or returned, via the one explicit sanitizer step
	 * in execution-sanitizer.js.
	 */
	async recordExecution(ownerId, { source, requestId, requestSnapshot, environmentId, workflowRunId, stepIndex, result, assertions, secretValues = [] }) {
		const assertionOutcome = evaluateAssertions(assertions, result);
		const diagnosis = diagnoseExecution(result, assertionOutcome);
		const sanitizedResult = sanitizeExecutionResult(result, secretValues);
		const sanitizedAssertionResults = sanitizeAssertionResults(assertionOutcome.results, secretValues);

		const document = await executionRepository.create({
			ownerId,
			source,
			requestId: requestId || null,
			requestSnapshot,
			environmentId: environmentId || null,
			workflowRunId: workflowRunId || null,
			stepIndex: stepIndex ?? null,
			success: sanitizedResult.success,
			status: sanitizedResult.status,
			statusText: sanitizedResult.statusText,
			resolvedUrl: sanitizedResult.resolvedUrl,
			resolvedRequest: sanitizedResult.resolvedRequest || undefined,
			responseHeaders: sanitizedResult.responseHeaders,
			responseBody: sanitizedResult.responseBody,
			responseSize: sanitizedResult.responseSize,
			durationMs: sanitizedResult.durationMs,
			errorMessage: sanitizedResult.errorMessage,
			unresolvedVariables: sanitizedResult.unresolvedVariables,
			assertionResults: sanitizedAssertionResults,
			assertionsPassed: assertionOutcome.allPassed,
			diagnosis,
		});
		return document;
	},

	list(ownerId, options) {
		return executionRepository.listCursor(ownerId, options);
	},

	async get(id, ownerId) {
		const execution = await executionRepository.findById(id, ownerId);
		if (!execution) throw new AppError(404, "EXECUTION_NOT_FOUND", "This execution does not exist.");
		return execution;
	},

	async compare(idA, idB, ownerId) {
		const [a, b] = await Promise.all([this.get(idA, ownerId), this.get(idB, ownerId)]);
		return { a, b };
	},

	listByWorkflowRun(workflowRunId, ownerId) {
		return executionRepository.listByWorkflowRun(workflowRunId, ownerId);
	},
};
