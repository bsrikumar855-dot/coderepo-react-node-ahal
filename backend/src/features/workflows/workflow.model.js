import mongoose from "mongoose";

const extractionRuleSchema = new mongoose.Schema(
	{
		variableName: { type: String, required: true, trim: true, maxlength: 120 },
		path: { type: String, required: true, trim: true, maxlength: 200 },
	},
	{ _id: false },
);

const stepSchema = new mongoose.Schema(
	{
		requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
		label: { type: String, trim: true, maxlength: 120, default: "" },
		extract: { type: [extractionRuleSchema], default: [] },
		continueOnFailure: { type: Boolean, default: false },
	},
	{ _id: false },
);

const workflowSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", default: null, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		description: { type: String, trim: true, maxlength: 500, default: "" },
		steps: { type: [stepSchema], default: [] },
	},
	{ timestamps: true },
);

export const WorkflowModel = mongoose.model("Workflow", workflowSchema);
