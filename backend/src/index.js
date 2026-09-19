import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./shared/config/database.js";
import { initConfig } from "./shared/config/index.js";

dotenv.config({ quiet: true });

const config = initConfig();
const HOST = "0.0.0.0";

await connectDatabase(config.mongodbUri);

const server = createApp().listen(config.port, HOST, () => {
	console.log(`Server running on port ${config.port}`);
	console.log(`Environment: ${config.nodeEnv}`);
});

async function shutdown(signal) {
	console.log(`${signal} received; closing the Ahal API.`);
	server.close(async () => {
		await disconnectDatabase();
		process.exit(0);
	});
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
