import mongoose from "mongoose";

const keyValueSchema = new mongoose.Schema(
	{
		key: { type: String, trim: true, default: "" },
		value: { type: String, default: "" },
		enabled: { type: Boolean, default: true },
	},
	{ _id: false },
);

const authConfigSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ["none", "bearer", "basic", "api-key"], default: "none" },
		token: { type: String, default: "" },
		username: { type: String, default: "" },
		password: { type: String, default: "" },
		apiKeyName: { type: String, default: "" },
		apiKeyValue: { type: String, default: "" },
		apiKeyLocation: { type: String, enum: ["header", "query"], default: "header" },
	},
	{ _id: false },
);

const assertionSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ["status", "header", "body", "responseTime"], required: true },
		operator: {
			type: String,
			enum: ["equals", "notEquals", "contains", "exists", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"],
			required: true,
		},
		path: { type: String, trim: true, default: "" },
		key: { type: String, trim: true, default: "" },
		expected: { type: mongoose.Schema.Types.Mixed, default: "" },
	},
	{ _id: false },
);

const requestSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true, index: true },
		folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"], default: "GET" },
		url: { type: String, required: true, trim: true, maxlength: 2000 },
		params: { type: [keyValueSchema], default: [] },
		headers: { type: [keyValueSchema], default: [] },
		bodyType: { type: String, enum: ["none", "json", "text", "form-urlencoded"], default: "none" },
		bodyContent: { type: String, default: "" },
		auth: { type: authConfigSchema, default: () => ({}) },
		tags: { type: [String], default: [] },
		assertions: { type: [assertionSchema], default: [] },
	},
	{ timestamps: true },
);

requestSchema.index({ ownerId: 1, collectionId: 1, folderId: 1 });
requestSchema.index({ ownerId: 1, name: "text", url: "text" });

export const RequestModel = mongoose.model("Request", requestSchema);
