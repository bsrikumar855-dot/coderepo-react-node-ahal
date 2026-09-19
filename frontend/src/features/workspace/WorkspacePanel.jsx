import { useCallback, useEffect, useState } from "react";
import { CollectionsSidebar } from "./CollectionsSidebar.jsx";
import { RequestBuilder } from "./RequestBuilder.jsx";
import { collectionsApi } from "./collections.api.js";
import { requestsApi } from "./requests.api.js";

export function WorkspacePanel({ environments, activeEnvironmentId, onEnvironmentChange }) {
	const [collections, setCollections] = useState([]);
	const [foldersByCollection, setFoldersByCollection] = useState({});
	const [requestsByCollection, setRequestsByCollection] = useState({});
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [error, setError] = useState("");
	const [showArchived, setShowArchived] = useState(false);

	const loadCollections = useCallback(async () => {
		try {
			setCollections(await collectionsApi.list(showArchived));
		} catch (requestError) {
			setError(requestError.message);
		}
	}, [showArchived]);

	useEffect(() => {
		loadCollections();
	}, [loadCollections]);

	const archiveCollection = async (collectionId) => {
		try {
			await collectionsApi.archive(collectionId);
			await loadCollections();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const unarchiveCollection = async (collectionId) => {
		try {
			await collectionsApi.unarchive(collectionId);
			await loadCollections();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const loadCollectionContents = async (collectionId) => {
		try {
			const [folders, requests] = await Promise.all([collectionsApi.listFolders(collectionId), requestsApi.listByCollection(collectionId)]);
			setFoldersByCollection((current) => ({ ...current, [collectionId]: folders }));
			setRequestsByCollection((current) => ({ ...current, [collectionId]: requests }));
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const createCollection = async (name) => {
		try {
			await collectionsApi.create({ name });
			await loadCollections();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const deleteCollection = async (collectionId) => {
		try {
			await collectionsApi.remove(collectionId);
			if (selectedRequest && requestsByCollection[collectionId]?.some((request) => request._id === selectedRequest._id)) setSelectedRequest(null);
			await loadCollections();
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const createFolder = async (collectionId) => {
		const name = window.prompt("Folder name");
		if (!name) return;
		try {
			await collectionsApi.createFolder(collectionId, { name });
			await loadCollectionContents(collectionId);
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const createRequest = async (collectionId, folderId) => {
		try {
			const created = await requestsApi.create({ collectionId, folderId: folderId || null, name: "New request", method: "GET", url: "https://" });
			await loadCollectionContents(collectionId);
			setSelectedRequest(created);
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const deleteRequest = async (collectionId, requestId) => {
		try {
			await requestsApi.remove(requestId);
			if (selectedRequest?._id === requestId) setSelectedRequest(null);
			await loadCollectionContents(collectionId);
		} catch (requestError) {
			setError(requestError.message);
		}
	};

	const saveRequest = async (id, patch) => {
		const updated = await requestsApi.update(id, patch);
		setSelectedRequest(updated);
		setRequestsByCollection((current) => {
			const collectionId = updated.collectionId;
			const list = current[collectionId];
			if (!list) return current;
			return { ...current, [collectionId]: list.map((request) => (request._id === id ? updated : request)) };
		});
	};

	const sendRequest = (id, environmentId) => requestsApi.execute(id, environmentId);

	return (
		<div className="workspace-panel">
			<CollectionsSidebar
				collections={collections}
				requestsByCollection={requestsByCollection}
				foldersByCollection={foldersByCollection}
				selectedRequestId={selectedRequest?._id}
				onSelectRequest={setSelectedRequest}
				onExpand={loadCollectionContents}
				onCreateCollection={createCollection}
				onCreateFolder={createFolder}
				onCreateRequest={createRequest}
				onDeleteCollection={deleteCollection}
				onDeleteRequest={deleteRequest}
				onArchiveCollection={archiveCollection}
				onUnarchiveCollection={unarchiveCollection}
				showArchived={showArchived}
				onToggleShowArchived={setShowArchived}
			/>
			<div className="workspace-main">
				{error && (
					<div className="inline-error" role="alert">
						{error}
					</div>
				)}
				{selectedRequest ? (
					<RequestBuilder key={selectedRequest._id} request={selectedRequest} environments={environments} activeEnvironmentId={activeEnvironmentId} onEnvironmentChange={onEnvironmentChange} onSave={saveRequest} onSend={sendRequest} />
				) : (
					<div className="workspace-placeholder">
						<h2>Select or create a request</h2>
						<p>Build a request on the left, then send it to see the response, run its assertions, and get a diagnosis if it fails.</p>
					</div>
				)}
			</div>
		</div>
	);
}
