import mongoose from "mongoose";

// A tiny stand-in "third-party" API that seeded requests and workflows point to, so a
// demo of Ahal's request execution, chaining, and failure diagnosis works without
// depending on live internet access. Its records are namespaced under ownerId so one
// account's demo traffic never mixes with another's.

const mockUserSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
	},
	{ timestamps: true },
);

const mockOrderSchema = new mongoose.Schema(
	{
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "MockUser", required: true },
		item: { type: String, required: true, trim: true, maxlength: 160 },
		quantity: { type: Number, required: true, min: 1, max: 1000 },
		unitPriceCents: { type: Number, required: true, min: 0 },
		status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
	},
	{ timestamps: true },
);

export const MockUserModel = mongoose.model("MockUser", mockUserSchema);
export const MockOrderModel = mongoose.model("MockOrder", mockOrderSchema);
