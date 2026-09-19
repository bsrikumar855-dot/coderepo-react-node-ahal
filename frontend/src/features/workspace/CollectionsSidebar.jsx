import { useState } from "react";

function methodClass(method) {
	return `method-tag method-${method.toLowerCase()}`;
}

export function CollectionsSidebar({ collections, requestsByCollection, foldersByCollection, selectedRequestId, onSelectRequest, onExpand, onCreateCollection, onCreateFolder, onCreateRequest, onDeleteCollection, onDeleteRequest, onArchiveCollection, onUnarchiveCollection, showArchived, onToggleShowArchived }) {
	const [expanded, setExpanded] = useState({});
	const [newCollectionName, setNewCollectionName] = useState("");

	const toggle = (collectionId) => {
		const next = { ...expanded, [collectionId]: !expanded[collectionId] };
		setExpanded(next);
		if (next[collectionId]) onExpand(collectionId);
	};

	const submitNewCollection = (event) => {
		event.preventDefault();
		if (!newCollectionName.trim()) return;
		onCreateCollection(newCollectionName.trim());
		setNewCollectionName("");
	};

	const renderRequest = (collectionId, request) => (
		<div key={request._id} className={`sidebar-request ${selectedRequestId === request._id ? "active" : ""}`} onClick={() => onSelectRequest(request)}>
			<span className={methodClass(request.method)}>{request.method}</span>
			<span className="sidebar-request-name">{request.name}</span>
			<button className="btn-icon sidebar-request-delete" onClick={(event) => { event.stopPropagation(); onDeleteRequest(collectionId, request._id); }} aria-label={`Delete ${request.name}`}>
				×
			</button>
		</div>
	);

	return (
		<aside className="collections-sidebar">
			<form className="sidebar-new-collection" onSubmit={submitNewCollection}>
				<input placeholder="New collection..." value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} />
				<button className="btn btn-ghost btn-small" type="submit">
					Add
				</button>
			</form>
			<label className="show-archived-toggle">
				<input type="checkbox" checked={showArchived} onChange={(event) => onToggleShowArchived(event.target.checked)} />
				Show archived
			</label>
			<div className="sidebar-tree">
				{collections.length === 0 && <p className="muted sidebar-empty">No collections yet. Create one above to start building requests.</p>}
				{collections.map((collection) => {
					const requests = requestsByCollection[collection._id] || [];
					const folders = foldersByCollection[collection._id] || [];
					const ungrouped = requests.filter((request) => !request.folderId);
					return (
						<div key={collection._id} className={`sidebar-collection ${collection.archivedAt ? "archived" : ""}`}>
							<div className="sidebar-collection-header" onClick={() => toggle(collection._id)}>
								<span className="disclosure">{expanded[collection._id] ? "▾" : "▸"}</span>
								<span className="sidebar-collection-name">
									{collection.name}
									{collection.archivedAt && <span className="pill pill-neutral">Archived</span>}
								</span>
								<div className="sidebar-collection-actions">
									{!collection.archivedAt && (
										<button className="btn-icon" title="New request" onClick={(event) => { event.stopPropagation(); onCreateRequest(collection._id, null); }}>
											+
										</button>
									)}
									{!collection.archivedAt && (
										<button className="btn-icon" title="New folder" onClick={(event) => { event.stopPropagation(); onCreateFolder(collection._id); }}>
											⌂
										</button>
									)}
									{collection.archivedAt ? (
										<button className="btn-icon" title="Unarchive collection" onClick={(event) => { event.stopPropagation(); onUnarchiveCollection(collection._id); }}>
											↺
										</button>
									) : (
										<button className="btn-icon" title="Archive collection" onClick={(event) => { event.stopPropagation(); onArchiveCollection(collection._id); }}>
											⤓
										</button>
									)}
									<button className="btn-icon" title="Delete collection" onClick={(event) => { event.stopPropagation(); onDeleteCollection(collection._id); }}>
										×
									</button>
								</div>
							</div>
							{expanded[collection._id] && (
								<div className="sidebar-collection-body">
									{folders.map((folder) => (
										<div key={folder._id} className="sidebar-folder">
											<div className="sidebar-folder-header">
												<span className="disclosure">▾</span>
												<span>{folder.name}</span>
												<button className="btn-icon" title="New request in folder" onClick={() => onCreateRequest(collection._id, folder._id)}>
													+
												</button>
											</div>
											<div className="sidebar-folder-body">{requests.filter((request) => request.folderId === folder._id).map((request) => renderRequest(collection._id, request))}</div>
										</div>
									))}
									{ungrouped.map((request) => renderRequest(collection._id, request))}
									{requests.length === 0 && folders.length === 0 && <p className="muted sidebar-empty">Empty. Use + to add a request.</p>}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</aside>
	);
}
