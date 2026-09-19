import mongoose from "mongoose";

const workflowRunSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true, index: true },
		workflowNameSnapshot: { type: String, default: "" },
		environmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Environment", default: null },
		status: { type: String, enum: ["running", "succeeded", "failed"], default: "running", index: true },
		stepCount: { type: Number, default: 0 },
		completedSteps: { type: Number, default: 0 },
		failedAtStep: { type: Number, default: null },
		// Final run-scope variable values (extracted from step responses), kept for
		// inspection after the run finishes - not the environment's own variables.
		runVariables: { type: mongoose.Schema.Types.Mixed, default: {} },
		startedAt: { type: Date, default: Date.now },
		finishedAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

workflowRunSchema.index({ ownerId: 1, workflowId: 1, _id: -1 });

export const WorkflowRunModel = mongoose.model("WorkflowRun", workflowRunSchema);
