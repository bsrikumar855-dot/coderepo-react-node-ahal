export function WorkflowStepEditor({ steps, availableRequests, onChange }) {
	const update = (index, patch) => {
		const next = steps.slice();
		next[index] = { ...next[index], ...patch };
		onChange(next);
	};
	const remove = (index) => onChange(steps.filter((_, stepIndex) => stepIndex !== index));
	const move = (index, delta) => {
		const target = index + delta;
		if (target < 0 || target >= steps.length) return;
		const next = steps.slice();
		[next[index], next[target]] = [next[target], next[index]];
		onChange(next);
	};
	const add = () => {
		if (!availableRequests.length) return;
		onChange([...steps, { requestId: availableRequests[0]._id, label: "", extract: [], continueOnFailure: false }]);
	};
	const updateExtract = (index, extract) => update(index, { extract });
	const addExtract = (index) => updateExtract(index, [...(steps[index].extract || []), { variableName: "", path: "" }]);
	const removeExtract = (index, extractIndex) => updateExtract(index, steps[index].extract.filter((_, i) => i !== extractIndex));
	const patchExtract = (index, extractIndex, patch) => {
		const next = steps[index].extract.slice();
		next[extractIndex] = { ...next[extractIndex], ...patch };
		updateExtract(index, next);
	};

	return (
		<div className="workflow-steps">
			{steps.map((step, index) => {
				const request = availableRequests.find((item) => item._id === step.requestId);
				return (
					<div className="workflow-step" key={index}>
						<div className="workflow-step-header">
							<span className="workflow-step-index">{index + 1}</span>
							<select value={step.requestId} onChange={(event) => update(index, { requestId: event.target.value })}>
								{availableRequests.map((option) => (
									<option key={option._id} value={option._id}>
										{option.method} {option.name}
									</option>
								))}
							</select>
							<input placeholder="Step label (optional)" value={step.label || ""} onChange={(event) => update(index, { label: event.target.value })} />
							<label className="continue-on-failure">
								<input type="checkbox" checked={step.continueOnFailure} onChange={(event) => update(index, { continueOnFailure: event.target.checked })} />
								Continue if this fails
							</label>
							<button className="btn-icon" onClick={() => move(index, -1)} aria-label="Move up" disabled={index === 0}>
								↑
							</button>
							<button className="btn-icon" onClick={() => move(index, 1)} aria-label="Move down" disabled={index === steps.length - 1}>
								↓
							</button>
							<button className="btn-icon" onClick={() => remove(index)} aria-label="Remove step">
								×
							</button>
						</div>
						{request && <p className="muted workflow-step-url">{request.url}</p>}
						<div className="workflow-extract">
							<span className="muted">Extract into variables:</span>
							{(step.extract || []).map((rule, extractIndex) => (
								<div className="extract-row" key={extractIndex}>
									<input placeholder="variableName" value={rule.variableName} onChange={(event) => patchExtract(index, extractIndex, { variableName: event.target.value })} />
									<span>=</span>
									<input placeholder="response.json.path" value={rule.path} onChange={(event) => patchExtract(index, extractIndex, { path: event.target.value })} />
									<button className="btn-icon" onClick={() => removeExtract(index, extractIndex)} aria-label="Remove extraction rule">
										×
									</button>
								</div>
							))}
							<button className="btn btn-ghost btn-small" onClick={() => addExtract(index)}>
								+ Extract variable
							</button>
						</div>
					</div>
				);
			})}
			<button className="btn btn-ghost" onClick={add} disabled={!availableRequests.length}>
				+ Add step
			</button>
			{!availableRequests.length && <p className="muted">Create a request in the Workspace tab first, then reference it here.</p>}
		</div>
	);
}
