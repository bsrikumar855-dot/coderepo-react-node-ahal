const OPERATORS_BY_TYPE = {
	status: ["equals", "notEquals", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"],
	responseTime: ["lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"],
	header: ["equals", "notEquals", "contains", "exists"],
	body: ["equals", "notEquals", "contains", "exists", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"],
};

export function AssertionsEditor({ assertions, onChange }) {
	const update = (index, patch) => {
		const next = assertions.slice();
		next[index] = { ...next[index], ...patch };
		onChange(next);
	};
	const remove = (index) => onChange(assertions.filter((_, rowIndex) => rowIndex !== index));
	const add = () => onChange([...assertions, { type: "status", operator: "equals", expected: 200 }]);

	return (
		<div className="assertions-editor">
			{assertions.length === 0 && <p className="muted">No assertions yet. A request without checks always shows as "sent", never "passed".</p>}
			{assertions.map((assertion, index) => (
				<div className="assertion-row" key={index}>
					<select value={assertion.type} onChange={(event) => update(index, { type: event.target.value, operator: OPERATORS_BY_TYPE[event.target.value][0] })}>
						<option value="status">Status</option>
						<option value="responseTime">Response time (ms)</option>
						<option value="header">Header</option>
						<option value="body">Body</option>
					</select>
					{assertion.type === "header" && <input placeholder="Header name" value={assertion.key || ""} onChange={(event) => update(index, { key: event.target.value })} />}
					{assertion.type === "body" && <input placeholder="JSON path (optional)" value={assertion.path || ""} onChange={(event) => update(index, { path: event.target.value })} />}
					<select value={assertion.operator} onChange={(event) => update(index, { operator: event.target.value })}>
						{OPERATORS_BY_TYPE[assertion.type].map((operator) => (
							<option key={operator} value={operator}>
								{operator}
							</option>
						))}
					</select>
					{assertion.operator !== "exists" && <input placeholder="Expected" value={assertion.expected ?? ""} onChange={(event) => update(index, { expected: event.target.value })} />}
					<button type="button" className="btn-icon" onClick={() => remove(index)} aria-label="Remove assertion">
						×
					</button>
				</div>
			))}
			<button type="button" className="btn btn-ghost btn-small" onClick={add}>
				+ Add assertion
			</button>
		</div>
	);
}
