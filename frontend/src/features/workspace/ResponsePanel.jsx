import { useState } from "react";
import { StatusPill, DiagnosisPill } from "../../shared/components/StatusPill.jsx";
import { formatBytes, formatDuration } from "../../shared/utils/format.js";

function prettyBody(body) {
	try {
		return JSON.stringify(JSON.parse(body), null, 2);
	} catch {
		return body;
	}
}

export function ResponsePanel({ execution, loading }) {
	const [tab, setTab] = useState("body");

	if (loading) {
		return (
			<div className="response-panel response-empty" role="status">
				<div className="spinner" /> Sending request...
			</div>
		);
	}
	if (!execution) {
		return (
			<div className="response-panel response-empty">
				<p>Send a request to see its response, assertion results, and diagnosis here.</p>
			</div>
		);
	}

	return (
		<div className="response-panel">
			<div className="response-meta">
				<StatusPill status={execution.status} success={execution.success} statusText={execution.statusText} />
				<span>{formatDuration(execution.durationMs)}</span>
				<span>{formatBytes(execution.responseSize)}</span>
				<DiagnosisPill code={execution.diagnosis.code} />
			</div>
			<div className="tab-strip" role="tablist">
				{["body", "headers", "assertions", "diagnosis"].map((name) => (
					<button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)} role="tab" aria-selected={tab === name}>
						{name === "assertions" ? `Assertions${execution.assertionResults.length ? ` (${execution.assertionResults.filter((a) => a.passed).length}/${execution.assertionResults.length})` : ""}` : name[0].toUpperCase() + name.slice(1)}
					</button>
				))}
			</div>
			{tab === "body" && <pre className="response-body">{execution.responseBody ? prettyBody(execution.responseBody) : execution.errorMessage || "(empty body)"}</pre>}
			{tab === "headers" && (
				<table className="kv-table">
					<tbody>
						{Object.entries(execution.responseHeaders || {}).map(([key, value]) => (
							<tr key={key}>
								<td>{key}</td>
								<td>{value}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			{tab === "assertions" && (
				<div className="assertion-results">
					{execution.assertionResults.length === 0 && <p className="muted">This request has no assertions attached.</p>}
					{execution.assertionResults.map((result, index) => (
						<div key={index} className={`assertion-result ${result.passed ? "pass" : "fail"}`}>
							<span className="assertion-result-icon">{result.passed ? "✓" : "✗"}</span>
							<div>
								<strong>
									{result.type} {result.operator} {result.expected !== "" ? String(result.expected) : ""}
								</strong>
								{!result.passed && <p className="muted">{result.message}</p>}
							</div>
						</div>
					))}
					{execution.unresolvedVariables?.length > 0 && (
						<p className="warning-note">Unresolved variables: {execution.unresolvedVariables.map((token) => `{{${token}}}`).join(", ")}</p>
					)}
				</div>
			)}
			{tab === "diagnosis" && (
				<div className="diagnosis-panel">
					<h4>{execution.diagnosis.title}</h4>
					<p>{execution.diagnosis.summary}</p>
					{execution.diagnosis.suggestions.length > 0 && (
						<ul>
							{execution.diagnosis.suggestions.map((suggestion, index) => (
								<li key={index}>{suggestion}</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
