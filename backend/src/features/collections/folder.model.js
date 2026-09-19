import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true, index: true },
		parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
		name: { type: String, required: true, trim: true, maxlength: 120 },
	},
	{ timestamps: true },
);

export const FolderModel = mongoose.model("Folder", folderSchema);
