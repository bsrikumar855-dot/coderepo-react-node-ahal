import { executeRequestDefinition } from "../requests/request-executor.js";
import { getByPath } from "../../shared/utils/json-path.js";

/**
 * Merges the active environment's variables with variables extracted from earlier
 * steps in this run. Run-scope variables always win on a key collision: they are
 * appended after the environment's own list, and buildVariableMap() (which folds an
 * array into a plain object in array order) lets a later entry silently overwrite an
 * earlier one with the same key. That precedence is intentional and load-bearing - a
 * workflow step that resolves "{{token}}" should see the token *this run* just fetched,
 * not a stale value sitting in the environment from a previous run. Getting this
 * backwards (environment overriding run-scope) is exactly the variable-resolution-scope
 * bug this function exists to rule out.
 */
export function mergeRunVariables(environmentVariables, runScopeVariables) {
	const runEntries = Object.entries(runScopeVariables).map(([key, value]) => ({ key, value: String(value ?? ""), enabled: true }));
	return [...(environmentVariables || []), ...runEntries];
}

/**
 * Runs a workflow's steps strictly in order, one at a time. Each step is awaited to
 * completion - including its assertion evaluation and persistence to execution history
 * - before the next step starts. Running steps concurrently (e.g. with Promise.all)
 * would let a later step read run-scope variables before an earlier step extracted
 * them, a real race condition for workflows that chain a create-then-fetch pattern.
 */
export async function runWorkflowSteps({ steps, environmentVariables, timeoutMs, onStepComplete }) {
	const runScopeVariables = {};
	let failedAtStep = null;

	for (let index = 0; index < steps.length; index += 1) {
		const step = steps[index];
		const mergedVariables = mergeRunVariables(environmentVariables, runScopeVariables);
		// eslint-disable-next-line no-await-in-loop
		const result = await executeRequestDefinition(step.definition, mergedVariables, timeoutMs);

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
