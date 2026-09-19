export function formatBytes(bytes) {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** exponent;
	return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export function formatDuration(ms) {
	if (ms === null || ms === undefined) return "-";
	if (ms < 1000) return `${ms} ms`;
	return `${(ms / 1000).toFixed(2)} s`;
}

export function formatTimestamp(value) {
	if (!value) return "-";
	return new Date(value).toLocaleString();
}

export function statusTone(status, success) {
	if (success === false || !status) return "danger";
	if (status >= 500) return "danger";
	if (status >= 400) return "warning";
	if (status >= 200) return "success";
	return "neutral";
}
