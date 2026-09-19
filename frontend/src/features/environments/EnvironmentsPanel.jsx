import { useEffect, useState } from "react";
import { KeyValueEditor, withRowIds } from "../../shared/components/KeyValueEditor.jsx";
import { environmentsApi } from "./environments.api.js";

export function EnvironmentsPanel({ environments, onChanged }) {
	const [selectedId, setSelectedId] = useState(environments[0]?._id || null);
	const [form, setForm] = useState(null);
	const [dirty, setDirty] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const selected = environments.find((environment) => environment._id === selectedId) || environments[0] || null;
		setSelectedId(selected?._id || null);
		setForm(selected ? { name: selected.name, variables: withRowIds(selected.variables) } : null);
		setDirty(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [environments]);

	const select = (environment) => {
		setSelectedId(environment._id);
		setForm({ name: environment.name, variables: withRowIds(environment.variables) });
		setDirty(false);
	};

	const createEnvironment = async () => {
		try {
			const created = await environmentsApi.create({ name: "New environment", variables: [] });
			await onChanged();
			select(created);
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const save = async () => {
		try {
			await environmentsApi.update(selectedId, { name: form.name, variables: form.variables.map(({ _rowId, ...row }) => row) });
			setDirty(false);
			await onChanged();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const remove = async (id) => {
		try {
			await environmentsApi.remove(id);
			await onChanged();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const activate = async (id) => {
		try {
			await environmentsApi.activate(id);
			await onChanged();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	return (
		<div className="environments-panel">
			<aside className="environments-list">
				<button className="btn btn-ghost btn-block" onClick={createEnvironment}>
					+ New environment
				</button>
				{environments.map((environment) => (
					<div key={environment._id} className={`environment-row ${selectedId === environment._id ? "active" : ""}`} onClick={() => select(environment)}>
						<span>{environment.name}</span>
						{environment.isActive && <span className="pill pill-success">Active</span>}
					</div>
				))}
			</aside>
			<div className="environments-editor">
				{error && (
					<div className="inline-error" role="alert">
						{error}
					</div>
				)}
				{form ? (
					<>
						<div className="environments-editor-header">
							<input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setDirty(true); }} />
							<button className="btn btn-ghost" onClick={() => activate(selectedId)} disabled={environments.find((e) => e._id === selectedId)?.isActive}>
								Set active
							</button>
							<button className="btn btn-primary" onClick={save} disabled={!dirty}>
								Save
							</button>
							<button className="btn btn-ghost" onClick={() => remove(selectedId)}>
								Delete
							</button>
						</div>
						<KeyValueEditor rows={form.variables} onChange={(variables) => { setForm({ ...form, variables }); setDirty(true); }} keyPlaceholder="VARIABLE_NAME" valuePlaceholder="value" secretToggle />
						<p className="muted">Use these as {"{{variableName}}"} inside any request URL, header, param, body, or auth field. Mark a variable "Secret" to mask it wherever it is displayed or stored - in this editor after saving, and in every execution record that resolves it.</p>
					</>
				) : (
					<div className="workspace-placeholder">
						<h2>No environments yet</h2>
						<p>Create one to store variables like a base URL, an API key, or auth tokens.</p>
					</div>
				)}
			</div>
		</div>
	);
}
