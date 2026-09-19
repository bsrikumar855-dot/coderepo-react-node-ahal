let nextRowId = 1;

export function withRowIds(pairs) {
	return pairs.map((pair) => ({ ...pair, _rowId: nextRowId++ }));
}

export function KeyValueEditor({ rows, onChange, keyPlaceholder = "Key", valuePlaceholder = "Value" }) {
	const update = (index, patch) => {
		const next = rows.slice();
		next[index] = { ...next[index], ...patch };
		onChange(next);
	};
	const remove = (index) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
	const add = () => onChange([...rows, { _rowId: nextRowId++, key: "", value: "", enabled: true }]);

	return (
		<div className="kv-editor">
			{rows.map((row, index) => (
				<div className="kv-row" key={row._rowId ?? index}>
					<input type="checkbox" checked={row.enabled !== false} onChange={(event) => update(index, { enabled: event.target.checked })} aria-label="Enabled" />
					<input placeholder={keyPlaceholder} value={row.key} onChange={(event) => update(index, { key: event.target.value })} />
					<input placeholder={valuePlaceholder} value={row.value} onChange={(event) => update(index, { value: event.target.value })} />
					<button type="button" className="btn-icon" onClick={() => remove(index)} aria-label="Remove row">
						×
					</button>
				</div>
			))}
			<button type="button" className="btn btn-ghost btn-small" onClick={add}>
				+ Add row
			</button>
		</div>
	);
}
