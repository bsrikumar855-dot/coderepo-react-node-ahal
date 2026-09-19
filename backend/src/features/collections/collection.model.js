import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		description: { type: String, trim: true, maxlength: 500, default: "" },
		archivedAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

collectionSchema.index({ ownerId: 1, name: 1 });

export const CollectionModel = mongoose.model("Collection", collectionSchema);
