import mongoose from "mongoose";

export async function connectDatabase(uri) {
	try {
		await mongoose.connect(uri);
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
}

export async function disconnectDatabase() {
	await mongoose.disconnect();
}
