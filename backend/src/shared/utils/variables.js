const VARIABLE_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}/g;

/**
 * Replaces {{key}} placeholders in a string with values from an environment variable map.
 * Unknown placeholders are left untouched so the caller can surface them as unresolved.
 */
export function resolveVariables(text, variableMap) {
	if (typeof text !== "string" || !text.includes("{{")) return { value: text, unresolved: [] };
	const unresolved = new Set();
	const value = text.replace(VARIABLE_PATTERN, (match, key) => {
		if (Object.prototype.hasOwnProperty.call(variableMap, key)) return variableMap[key];
		unresolved.add(key);
		return match;
	});
	return { value, unresolved: [...unresolved] };
}

export function buildVariableMap(variables = []) {
	const map = {};
	for (const variable of variables) {
		if (variable && variable.enabled !== false && variable.key) map[variable.key] = variable.value ?? "";
	}
	return map;
}
