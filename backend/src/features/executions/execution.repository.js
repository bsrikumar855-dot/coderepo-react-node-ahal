import mongoose from "mongoose";
import { ExecutionModel } from "./execution.model.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const executionRepository = {
	create(document) {
		return ExecutionModel.create(document);
	},

	findById(id, ownerId) {
		return ExecutionModel.findOne({ _id: id, ownerId });
	},

	findByIds(ids, ownerId) {
		return ExecutionModel.find({ _id: { $in: ids }, ownerId });
	},

	listByWorkflowRun(workflowRunId, ownerId) {
		return ExecutionModel.find({ workflowRunId, ownerId }).sort({ stepIndex: 1 });
	},

	/**
	 * Cursor pagination over execution history: newest first, keyed on _id (which is
	 * monotonic with insertion order). A page returns one more row than requested so
	 * the caller can tell whether a further page exists without a separate count query.
	 */
	async listCursor(ownerId, { cursor, limit, requestId, success } = {}) {
		const pageSize = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
		const filter = { ownerId };
		if (requestId) filter.requestId = requestId;
		if (success === "true") filter.success = true;
		if (success === "false") filter.success = false;
		if (cursor && mongoose.isValidObjectId(cursor)) filter._id = { $lt: cursor };

		const rows = await ExecutionModel.find(filter)
			.sort({ _id: -1 })
			.limit(pageSize + 1);

		const hasMore = rows.length > pageSize;
		const items = hasMore ? rows.slice(0, pageSize) : rows;
		return { items, nextCursor: hasMore ? String(items[items.length - 1]._id) : null };
	},
};
