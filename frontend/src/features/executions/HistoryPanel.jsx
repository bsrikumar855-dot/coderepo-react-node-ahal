import { useEffect, useState } from "react";
import { StatusPill, DiagnosisPill } from "../../shared/components/StatusPill.jsx";
import { formatDuration, formatTimestamp } from "../../shared/utils/format.js";
import { ResponsePanel } from "../workspace/ResponsePanel.jsx";
import { executionsApi } from "./executions.api.js";
import { CompareView } from "./CompareView.jsx";

export function HistoryPanel() {
	const [items, setItems] = useState([]);
	const [nextCursor, setNextCursor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [successFilter, setSuccessFilter] = useState("");
	const [selectedId, setSelectedId] = useState(null);
	const [selectedDetail, setSelectedDetail] = useState(null);
	const [compareIds, setCompareIds] = useState([]);
	const [compareData, setCompareData] = useState(null);

	const load = async (cursor) => {
		try {
			setLoading(true);
			setError("");
			const page = await executionsApi.list({ cursor, success: successFilter });
			setItems((current) => (cursor ? [...current, ...page.data] : page.data));
			setNextCursor(page.meta?.nextCursor || null);
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setItems([]);
		load(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [successFilter]);

	const toggleCompare = (id) => {
		setCompareIds((current) => {
			if (current.includes(id)) return current.filter((item) => item !== id);
			if (current.length >= 2) return [current[1], id];
			return [...current, id];
		});
	};

	const openCompare = async () => {
		try {
			setCompareData(await executionsApi.compare(compareIds[0], compareIds[1]));
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const selectRow = async (id) => {
		setSelectedId(id);
		try {
			setSelectedDetail(await executionsApi.get(id));
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const selected = selectedDetail && selectedDetail._id === selectedId ? selectedDetail : null;

	return (
		<div className="history-panel">
			<div className="history-list">
				<div className="history-filters">
					<select value={successFilter} onChange={(event) => setSuccessFilter(event.target.value)}>
						<option value="">All outcomes</option>
						<option value="true">Sent successfully</option>
						<option value="false">Failed to send</option>
					</select>
					{compareIds.length === 2 && (
						<button className="btn btn-ghost btn-small" onClick={openCompare}>
							Compare selected
						</button>
					)}
				</div>
				{error && (
					<div className="inline-error" role="alert">
						{error}
					</div>
				)}
				{items.map((execution) => (
					<div key={execution._id} className={`history-row ${selectedId === execution._id ? "active" : ""}`} onClick={() => selectRow(execution._id)}>
						<input type="checkbox" checked={compareIds.includes(execution._id)} onChange={() => toggleCompare(execution._id)} onClick={(event) => event.stopPropagation()} />
						<div className="history-row-main">
							<div className="history-row-top">
								<span className="method-tag">{execution.requestSnapshot.method}</span>
								<span>{execution.requestSnapshot.name}</span>
							</div>
							<div className="history-row-bottom">
								<StatusPill status={execution.status} success={execution.success} statusText={execution.statusText} />
								<DiagnosisPill code={execution.diagnosis.code} />
								<span className="muted">{formatDuration(execution.durationMs)}</span>
								<span className="muted">{formatTimestamp(execution.createdAt)}</span>
							</div>
						</div>
					</div>
				))}
				{!loading && items.length === 0 && <p className="muted sidebar-empty">No executions yet. Send a request or run a workflow to see history here.</p>}
				{nextCursor && (
					<button className="btn btn-ghost btn-block" onClick={() => load(nextCursor)} disabled={loading}>
						{loading ? "Loading..." : "Load more"}
					</button>
				)}
			</div>
			<div className="history-detail">
				{selected ? (
					<>
						<h3>{selected.requestSnapshot.name}</h3>
						<p className="muted">{selected.resolvedUrl}</p>
						<ResponsePanel execution={selected} loading={false} />
					</>
				) : (
					<div className="workspace-placeholder">
						<h2>Select an execution</h2>
						<p>Pick a row to inspect its full response, assertion results, and diagnosis. Check two rows to compare them side by side.</p>
					</div>
				)}
			</div>
			{compareData && <CompareView a={compareData.a} b={compareData.b} onClose={() => setCompareData(null)} />}
		</div>
	);
}
