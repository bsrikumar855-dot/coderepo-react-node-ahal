import { useEffect, useState } from "react";
import { requestsApi } from "../workspace/requests.api.js";
import { workflowsApi } from "./workflows.api.js";
import { WorkflowStepEditor } from "./WorkflowStepEditor.jsx";
import { WorkflowRunResult } from "./WorkflowRunResult.jsx";

export function WorkflowsPanel({ environments, activeEnvironmentId, onEnvironmentChange }) {
	const [workflows, setWorkflows] = useState([]);
	const [availableRequests, setAvailableRequests] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [form, setForm] = useState(null);
	const [dirty, setDirty] = useState(false);
	const [error, setError] = useState("");
	const [running, setRunning] = useState(false);
	const [runResult, setRunResult] = useState(null);
	const [pastRuns, setPastRuns] = useState([]);

	const loadWorkflows = async () => {
		try {
			setWorkflows(await workflowsApi.list());
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	useEffect(() => {
		loadWorkflows();
		requestsApi
			.searchAll()
			.then(setAvailableRequests)
			.catch((requestError) => setError(requestError.message));
	}, []);

	const select = async (workflow) => {
		setSelectedId(workflow._id);
		setForm({ name: workflow.name, description: workflow.description, steps: workflow.steps });
		setDirty(false);
		setRunResult(null);
		try {
			setPastRuns(await workflowsApi.listRuns(workflow._id));
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const viewPastRun = async (runId) => {
		try {
			setRunResult(await workflowsApi.getRun(selectedId, runId));
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const createWorkflow = async () => {
		try {
			const created = await workflowsApi.create({ name: "New workflow", description: "", steps: [] });
			await loadWorkflows();
			select(created);
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const save = async () => {
		try {
			const updated = await workflowsApi.update(selectedId, form);
			setDirty(false);
			setWorkflows((current) => current.map((workflow) => (workflow._id === selectedId ? updated : workflow)));
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const remove = async (id) => {
		try {
			await workflowsApi.remove(id);
			if (selectedId === id) {
				setSelectedId(null);
				setForm(null);
			}
			await loadWorkflows();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const run = async () => {
		try {
			setRunning(true);
			setError("");
			if (dirty) await save();
			const outcome = await workflowsApi.run(selectedId, activeEnvironmentId);
			setRunResult(outcome);
			setPastRuns(await workflowsApi.listRuns(selectedId));
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setRunning(false);
		}
	};

	return (
		<div className="workflows-panel">
			<aside className="workflows-list">
				<button className="btn btn-ghost btn-block" onClick={createWorkflow}>
					+ New workflow
				</button>
				{workflows.map((workflow) => (
					<div key={workflow._id} className={`workflow-row ${selectedId === workflow._id ? "active" : ""}`} onClick={() => select(workflow)}>
						<span>{workflow.name}</span>
						<span className="muted">{workflow.steps.length} steps</span>
					</div>
				))}
				{workflows.length === 0 && <p className="muted sidebar-empty">No workflows yet.</p>}
			</aside>
			<div className="workflows-editor">
				{error && (
					<div className="inline-error" role="alert">
						{error}
					</div>
				)}
				{form ? (
					<>
						<div className="workflows-editor-header">
							<input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setDirty(true); }} />
							<select value={activeEnvironmentId || ""} onChange={(event) => onEnvironmentChange(event.target.value || null)}>
								<option value="">No environment</option>
								{environments.map((environment) => (
									<option key={environment._id} value={environment._id}>
										{environment.name}
									</option>
								))}
							</select>
							<button className="btn btn-ghost" onClick={save} disabled={!dirty}>
								Save
							</button>
							<button className="btn btn-primary" onClick={run} disabled={running || form.steps.length === 0}>
								{running ? "Running..." : "Run"}
							</button>
							<button className="btn btn-ghost" onClick={() => remove(selectedId)}>
								Delete
							</button>
						</div>
						<textarea className="workflow-description" rows={2} placeholder="What does this workflow do?" value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); setDirty(true); }} />
						<WorkflowStepEditor steps={form.steps} availableRequests={availableRequests} onChange={(steps) => { setForm({ ...form, steps }); setDirty(true); }} />
						{pastRuns.length > 0 && (
							<div className="workflow-past-runs">
								<span className="muted">Past runs:</span>
								<div className="workflow-past-runs-list">
									{pastRuns.map((pastRun) => (
										<button key={pastRun._id} className={`pill pill-${pastRun.status === "succeeded" ? "success" : pastRun.status === "failed" ? "danger" : "neutral"}`} onClick={() => viewPastRun(pastRun._id)}>
											{new Date(pastRun.startedAt).toLocaleString()} · {pastRun.completedSteps}/{pastRun.stepCount}
										</button>
									))}
								</div>
							</div>
						)}
						{runResult && <WorkflowRunResult run={runResult.run} executions={runResult.executions} />}
					</>
				) : (
					<div className="workspace-placeholder">
						<h2>Chain requests into a workflow</h2>
						<p>A workflow runs its steps strictly in order, letting a later step use a variable extracted from an earlier step's response - for example, creating a record and then fetching it by the id it returned.</p>
					</div>
				)}
			</div>
		</div>
	);
}
