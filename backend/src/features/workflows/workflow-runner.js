import { executeRequestDefinition } from "../requests/request-executor.js";
import { getByPath } from "../../shared/utils/json-path.js";

/**
 * Runs a workflow's steps strictly in order, one at a time. Each step is awaited to
 * completion - including its assertion evaluation and persistence to execution history
 * - before the next step starts. Running steps concurrently (e.g. with Promise.all)
 * would let a later step read run-scope variables before an earlier step extracted
 * them, a real race condition for workflows that chain a create-then-fetch pattern.
 *
 * Environment variables and run-scope (workflow) variables are passed to the executor
 * as two separate namespaces rather than merged into one object; see
 * shared/utils/variables.js for why, and for the explicit precedence order.
 */
export async function runWorkflowSteps({ steps, environmentVariables, timeoutMs, onStepComplete }) {
	const runScopeVariables = {};
	let failedAtStep = null;

	for (let index = 0; index < steps.length; index += 1) {
		const step = steps[index];
		// eslint-disable-next-line no-await-in-loop
		const result = await executeRequestDefinition(step.definition, { environmentVariables, workflowVariables: runScopeVariables }, timeoutMs);

		if (result.success) {
			const parsedBody = safeParseJson(result.responseBody);
			for (const rule of step.extract || []) {
				const value = getByPath(parsedBody, rule.path);
				if (value !== undefined) runScopeVariables[rule.variableName] = typeof value === "object" ? JSON.stringify(value) : value;
			}
		}

		// eslint-disable-next-line no-await-in-loop
		const execution = await onStepComplete(index, step, result);

		if (!result.success && !step.continueOnFailure) {
			failedAtStep = index;
			return { completedSteps: index + 1, failedAtStep, runVariables: runScopeVariables, lastExecution: execution };
		}
		if (execution.assertionsPassed === false && !step.continueOnFailure) {
			failedAtStep = index;
			return { completedSteps: index + 1, failedAtStep, runVariables: runScopeVariables, lastExecution: execution };
		}
	}

	return { completedSteps: steps.length, failedAtStep: null, runVariables: runScopeVariables, lastExecution: null };
}

function safeParseJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}
