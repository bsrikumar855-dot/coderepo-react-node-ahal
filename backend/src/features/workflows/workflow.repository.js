import { WorkflowModel } from "./workflow.model.js";
import { WorkflowRunModel } from "./workflow-run.model.js";

export const workflowRepository = {
	list(ownerId) {
		return WorkflowModel.find({ ownerId }).sort({ updatedAt: -1 });
	},
	findById(id, ownerId) {
		return WorkflowModel.findOne({ _id: id, ownerId });
	},
	create(ownerId, payload) {
		return WorkflowModel.create({ ownerId, ...payload });
	},
	update(id, ownerId, updates) {
		return WorkflowModel.findOneAndUpdate({ _id: id, ownerId }, updates, { new: true, runValidators: true });
	},
	delete(id, ownerId) {
		return WorkflowModel.findOneAndDelete({ _id: id, ownerId });
	},

	createRun(document) {
		return WorkflowRunModel.create(document);
	},
	findRunById(id, ownerId) {
		return WorkflowRunModel.findOne({ _id: id, ownerId });
	},
	listRuns(workflowId, ownerId) {
		return WorkflowRunModel.find({ workflowId, ownerId }).sort({ _id: -1 }).limit(50);
	},
	async updateRun(id, updates) {
		return WorkflowRunModel.findByIdAndUpdate(id, updates, { new: true });
	},
};
