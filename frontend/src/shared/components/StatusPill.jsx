import { statusTone } from "../utils/format.js";

export function StatusPill({ status, success, statusText }) {
	const tone = statusTone(status, success);
	const label = status ? `${status}${statusText ? ` ${statusText}` : ""}` : "No response";
	return <span className={`pill pill-${tone}`}>{label}</span>;
}

export function DiagnosisPill({ code }) {
	const tone = code === "SUCCESS" ? "success" : code === "ASSERTION_FAILED" || code === "CLIENT_ERROR" || code === "UNRESOLVED_VARIABLES" ? "warning" : "danger";
	return <span className={`pill pill-${tone}`}>{code.replaceAll("_", " ")}</span>;
}
