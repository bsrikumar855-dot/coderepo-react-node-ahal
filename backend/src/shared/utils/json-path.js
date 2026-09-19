/**
 * Resolves a dot/bracket path ("data.items[0].id") against a parsed JSON value.
 * Shared by assertion evaluation (checking a response) and workflow variable
 * extraction (pulling a value out of one step's response for a later step to use).
 */
export function getByPath(source, path) {
	if (!path) return source;
	const segments = path
		.replace(/\[(\d+)\]/g, ".$1")
		.split(".")
		.filter(Boolean);
	let cursor = source;
	for (const segment of segments) {
		if (cursor === null || cursor === undefined) return undefined;
		cursor = cursor[segment];
	}
	return cursor;
}
