const VARIABLE_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function buildVariableMap(variables = []) {
	const map = {};
	for (const variable of variables) {
		if (variable && variable.enabled !== false && variable.key) map[variable.key] = variable.value ?? "";
	}
	return map;
}

/**
 * Resolves {{key}} placeholders against two separate namespaces rather than one
 * merged object. Workflow (run-scope) variables and environment variables come from
 * different lifetimes - an environment variable outlives many runs, a workflow
 * variable exists only for the run that extracted it - so they are kept as two
 * distinct maps and looked up in an explicit order instead of being flattened into
 * one object before resolution. Precedence: workflowVariables is checked first,
 * environmentVariables second, because a run-scope value (e.g. a token this run just
 * fetched) is always more specific to what is happening right now than whatever an
 * environment happens to have saved from a previous run.
 */
export function resolveVariables(text, { workflowVariables = {}, environmentVariables = {} } = {}) {
	if (typeof text !== "string" || !text.includes("{{")) return { value: text, unresolved: [] };
	const unresolved = new Set();
	const value = text.replace(VARIABLE_PATTERN, (match, key) => {
		if (Object.prototype.hasOwnProperty.call(workflowVariables, key)) return workflowVariables[key];
		if (Object.prototype.hasOwnProperty.call(environmentVariables, key)) return environmentVariables[key];
		unresolved.add(key);
		return match;
	});
	return { value, unresolved: [...unresolved] };
}

export function extractSecretValues(variables = []) {
	return variables.filter((variable) => variable && variable.secret && variable.enabled !== false && variable.value).map((variable) => variable.value);
}
