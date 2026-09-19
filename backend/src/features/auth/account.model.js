import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 80 },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
		passwordHash: { type: String, required: true },
	},
	{ timestamps: true },
);

accountSchema.set("toJSON", {
	transform: (_document, ret) => {
		delete ret.passwordHash;
		delete ret.__v;
		return ret;
	},
});

export const AccountModel = mongoose.model("Account", accountSchema);
