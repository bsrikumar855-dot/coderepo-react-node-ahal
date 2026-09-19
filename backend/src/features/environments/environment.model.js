import mongoose from "mongoose";

const variableSchema = new mongoose.Schema(
	{
		key: { type: String, trim: true, required: true, maxlength: 120 },
		value: { type: String, default: "" },
		enabled: { type: Boolean, default: true },
		secret: { type: Boolean, default: false },
	},
	{ _id: false },
);

const environmentSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		variables: { type: [variableSchema], default: [] },
		isActive: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

environmentSchema.index({ ownerId: 1, name: 1 });

export const EnvironmentModel = mongoose.model("Environment", environmentSchema);
