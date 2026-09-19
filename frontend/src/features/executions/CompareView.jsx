import { StatusPill, DiagnosisPill } from "../../shared/components/StatusPill.jsx";
import { formatBytes, formatDuration, formatTimestamp } from "../../shared/utils/format.js";

function Column({ execution }) {
	return (
		<div className="compare-column">
			<h4>{execution.requestSnapshot.name}</h4>
			<p className="muted">{formatTimestamp(execution.createdAt)}</p>
			<StatusPill status={execution.status} success={execution.success} statusText={execution.statusText} />
			<DiagnosisPill code={execution.diagnosis.code} />
			<dl className="compare-facts">
				<dt>Duration</dt>
				<dd>{formatDuration(execution.durationMs)}</dd>
				<dt>Size</dt>
				<dd>{formatBytes(execution.responseSize)}</dd>
				<dt>Assertions</dt>
				<dd>
					{execution.assertionResults.filter((a) => a.passed).length}/{execution.assertionResults.length} passed
				</dd>
			</dl>
			<pre className="response-body">{execution.responseBody}</pre>
		</div>
	);
}

export function CompareView({ a, b, onClose }) {
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal compare-modal" onClick={(event) => event.stopPropagation()}>
				<div className="modal-header">
					<h3>Compare executions</h3>
					<button className="btn-icon" onClick={onClose} aria-label="Close">
						×
					</button>
				</div>
				<div className="compare-columns">
					<Column execution={a} />
					<Column execution={b} />
				</div>
			</div>
		</div>
	);
}
