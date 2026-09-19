import mongoose from "mongoose";

const assertionResultSchema = new mongoose.Schema(
	{
		type: { type: String, required: true },
		operator: { type: String, required: true },
		path: { type: String, default: "" },
		key: { type: String, default: "" },
		expected: { type: mongoose.Schema.Types.Mixed, default: "" },
		actual: { type: mongoose.Schema.Types.Mixed, default: null },
		passed: { type: Boolean, required: true },
		message: { type: String, default: "" },
	},
	{ _id: false },
);

const diagnosisSchema = new mongoose.Schema(
	{
		code: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		suggestions: { type: [String], default: [] },
	},
	{ _id: false },
);

const executionSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		source: { type: String, enum: ["request", "workflow-step"], required: true, index: true },
		requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", default: null, index: true },
		requestSnapshot: {
			name: { type: String, default: "" },
			method: { type: String, default: "GET" },
			url: { type: String, default: "" },
		},
		environmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Environment", default: null },
		workflowRunId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkflowRun", default: null, index: true },
		stepIndex: { type: Number, default: null },

		success: { type: Boolean, required: true },
		status: { type: Number, default: null },
		statusText: { type: String, default: null },
		resolvedUrl: { type: String, default: "" },
		resolvedRequest: {
			method: { type: String, default: "" },
			url: { type: String, default: "" },
			headers: { type: mongoose.Schema.Types.Mixed, default: {} },
			body: { type: String, default: null },
		},
		responseHeaders: { type: mongoose.Schema.Types.Mixed, default: {} },
		responseBody: { type: String, default: "" },
		responseSize: { type: Number, default: 0 },
		durationMs: { type: Number, default: 0 },
		errorMessage: { type: String, default: null },
		unresolvedVariables: { type: [String], default: [] },

		assertionResults: { type: [assertionResultSchema], default: [] },
		assertionsPassed: { type: Boolean, default: true },
		diagnosis: { type: diagnosisSchema, required: true },
	},
	{ timestamps: true },
);

// Execution history is read back scoped to an owner and ordered newest-first for both
// the cursor-paginated list and workflow-run detail views.
executionSchema.index({ ownerId: 1, _id: -1 });
executionSchema.index({ ownerId: 1, requestId: 1, _id: -1 });
executionSchema.index({ ownerId: 1, workflowRunId: 1, stepIndex: 1 });

export const ExecutionModel = mongoose.model("Execution", executionSchema);
