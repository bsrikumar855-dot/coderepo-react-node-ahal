import { StatusPill, DiagnosisPill } from "../../shared/components/StatusPill.jsx";
import { formatDuration } from "../../shared/utils/format.js";

export function WorkflowRunResult({ run, executions }) {
	return (
		<div className="workflow-run-result">
			<div className="workflow-run-summary">
				<span className={`pill pill-${run.status === "succeeded" ? "success" : run.status === "failed" ? "danger" : "neutral"}`}>{run.status}</span>
				<span>
					{run.completedSteps}/{run.stepCount} steps
				</span>
				{run.failedAtStep !== null && run.failedAtStep !== undefined && <span className="muted">failed at step {run.failedAtStep + 1}</span>}
			</div>
			<ol className="workflow-run-steps">
				{executions.map((execution) => (
					<li key={execution._id} className="workflow-run-step">
						<div className="workflow-run-step-header">
							<StatusPill status={execution.status} success={execution.success} statusText={execution.statusText} />
							<span>{execution.requestSnapshot.name}</span>
							<span className="muted">{formatDuration(execution.durationMs)}</span>
							<DiagnosisPill code={execution.diagnosis.code} />
						</div>
						{execution.diagnosis.code !== "SUCCESS" && <p className="muted">{execution.diagnosis.summary}</p>}
					</li>
				))}
			</ol>
			{Object.keys(run.runVariables || {}).length > 0 && (
				<div className="workflow-run-variables">
					<span className="muted">Variables extracted during this run:</span>
					<table className="kv-table">
						<tbody>
							{Object.entries(run.runVariables).map(([key, value]) => (
								<tr key={key}>
									<td>{key}</td>
									<td>{String(value)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
