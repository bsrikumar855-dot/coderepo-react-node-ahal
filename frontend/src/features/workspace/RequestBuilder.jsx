import { useEffect, useState } from "react";
import { KeyValueEditor, withRowIds } from "../../shared/components/KeyValueEditor.jsx";
import { AssertionsEditor } from "./AssertionsEditor.jsx";
import { ResponsePanel } from "./ResponsePanel.jsx";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const AUTH_TYPES = ["none", "bearer", "basic", "api-key"];

function toForm(request) {
	return {
		name: request.name,
		method: request.method,
		url: request.url,
		params: withRowIds(request.params || []),
		headers: withRowIds(request.headers || []),
		bodyType: request.bodyType,
		bodyContent: request.bodyContent || "",
		auth: request.auth || { type: "none" },
		assertions: request.assertions || [],
	};
}

export function RequestBuilder({ request, environments, activeEnvironmentId, onEnvironmentChange, onSave, onSend, saving }) {
	const [form, setForm] = useState(() => toForm(request));
	const [tab, setTab] = useState("params");
	const [execution, setExecution] = useState(null);
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState("");
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		setForm(toForm(request));
		setExecution(null);
		setDirty(false);
		setSendError("");
	}, [request._id]);

	const patchForm = (patch) => {
		setForm((current) => ({ ...current, ...patch }));
		setDirty(true);
	};

	const save = async () => {
		await onSave(request._id, {
			name: form.name,
			method: form.method,
			url: form.url,
			params: form.params.map(({ _rowId, ...row }) => row),
			headers: form.headers.map(({ _rowId, ...row }) => row),
			bodyType: form.bodyType,
			bodyContent: form.bodyContent,
			auth: form.auth,
			assertions: form.assertions,
		});
		setDirty(false);
	};

	const send = async () => {
		try {
			setSending(true);
			setSendError("");
			if (dirty) await save();
			const result = await onSend(request._id, activeEnvironmentId);
			setExecution(result);
		} catch (error) {
			setSendError(error.message);
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="request-builder">
			<div className="request-line">
				<select value={form.method} onChange={(event) => patchForm({ method: event.target.value })}>
					{METHODS.map((method) => (
						<option key={method} value={method}>
							{method}
						</option>
					))}
				</select>
				<input className="url-input" value={form.url} onChange={(event) => patchForm({ url: event.target.value })} placeholder="{{baseUrl}}/path" />
				<select className="env-select" value={activeEnvironmentId || ""} onChange={(event) => onEnvironmentChange(event.target.value || null)} title="Environment used when sending">
					<option value="">No environment</option>
					{environments.map((environment) => (
						<option key={environment._id} value={environment._id}>
							{environment.name}
						</option>
					))}
				</select>
				<button className="btn btn-ghost" onClick={save} disabled={!dirty || saving}>
					Save
				</button>
				<button className="btn btn-primary" onClick={send} disabled={sending}>
					{sending ? "Sending..." : "Send"}
				</button>
			</div>
			<input className="request-name-input" value={form.name} onChange={(event) => patchForm({ name: event.target.value })} placeholder="Request name" />

			<div className="tab-strip" role="tablist">
				{["params", "headers", "body", "auth", "assertions"].map((name) => (
					<button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)} role="tab" aria-selected={tab === name}>
						{name[0].toUpperCase() + name.slice(1)}
						{name === "params" && form.params.filter((p) => p.key).length > 0 ? ` (${form.params.filter((p) => p.key).length})` : ""}
						{name === "headers" && form.headers.filter((h) => h.key).length > 0 ? ` (${form.headers.filter((h) => h.key).length})` : ""}
						{name === "assertions" && form.assertions.length > 0 ? ` (${form.assertions.length})` : ""}
					</button>
				))}
			</div>

			<div className="tab-body">
				{tab === "params" && <KeyValueEditor rows={form.params} onChange={(rows) => patchForm({ params: rows })} />}
				{tab === "headers" && <KeyValueEditor rows={form.headers} onChange={(rows) => patchForm({ headers: rows })} />}
				{tab === "body" && (
					<div className="body-editor">
						<select value={form.bodyType} onChange={(event) => patchForm({ bodyType: event.target.value })}>
							<option value="none">None</option>
							<option value="json">JSON</option>
							<option value="text">Text</option>
							<option value="form-urlencoded">Form URL-encoded</option>
						</select>
						{form.bodyType !== "none" && <textarea rows={10} value={form.bodyContent} onChange={(event) => patchForm({ bodyContent: event.target.value })} spellCheck={false} />}
					</div>
				)}
				{tab === "auth" && (
					<div className="auth-editor">
						<select value={form.auth.type} onChange={(event) => patchForm({ auth: { ...form.auth, type: event.target.value } })}>
							{AUTH_TYPES.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
						{form.auth.type === "bearer" && <input placeholder="Token" value={form.auth.token || ""} onChange={(event) => patchForm({ auth: { ...form.auth, token: event.target.value } })} />}
						{form.auth.type === "basic" && (
							<>
								<input placeholder="Username" value={form.auth.username || ""} onChange={(event) => patchForm({ auth: { ...form.auth, username: event.target.value } })} />
								<input placeholder="Password" value={form.auth.password || ""} onChange={(event) => patchForm({ auth: { ...form.auth, password: event.target.value } })} />
							</>
						)}
						{form.auth.type === "api-key" && (
							<>
								<input placeholder="Key name" value={form.auth.apiKeyName || ""} onChange={(event) => patchForm({ auth: { ...form.auth, apiKeyName: event.target.value } })} />
								<input placeholder="Key value" value={form.auth.apiKeyValue || ""} onChange={(event) => patchForm({ auth: { ...form.auth, apiKeyValue: event.target.value } })} />
								<select value={form.auth.apiKeyLocation || "header"} onChange={(event) => patchForm({ auth: { ...form.auth, apiKeyLocation: event.target.value } })}>
									<option value="header">Header</option>
									<option value="query">Query param</option>
								</select>
							</>
						)}
					</div>
				)}
				{tab === "assertions" && <AssertionsEditor assertions={form.assertions} onChange={(assertions) => patchForm({ assertions })} />}
			</div>

			{sendError && (
				<div className="inline-error" role="alert">
					{sendError}
				</div>
			)}
			<ResponsePanel execution={execution} loading={sending} />
		</div>
	);
}
