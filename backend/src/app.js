import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { authRouter } from "./features/auth/auth.routes.js";
import { collectionRouter } from "./features/collections/collection.routes.js";
import { environmentRouter } from "./features/environments/environment.routes.js";
import { executionRouter } from "./features/executions/execution.routes.js";
import { mockTargetRouter } from "./features/mock-target/mock-target.routes.js";
import { requestRouter } from "./features/requests/request.routes.js";
import { workflowRouter } from "./features/workflows/workflow.routes.js";
import { requireAuth } from "./shared/middleware/auth.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler.js";

export function createApp() {
	const app = express();
	app.disable("x-powered-by");
	app.use(cors());
	app.use(express.json({ limit: "200kb" }));

	// Health reporting distinguishes a live API process from a working MongoDB
	// connection, since one can be up without the other.
	app.get("/api/v1/health", (request, response) => {
		const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
		response.status(database === "connected" ? 200 : 503).json({ data: { status: database === "connected" ? "ok" : "degraded", database } });
	});

	// The mock target stands in for an unrelated third-party API that seeded requests
	// and workflows call out to. It authenticates callers with its own scheme (see
	// mock-target.routes.js), not Ahal's session auth, so it is mounted ahead of
	// requireAuth below.
	app.use("/api/v1/mock", mockTargetRouter);

	app.use("/api/v1/auth", authRouter);

	app.use("/api/v1", requireAuth);
	app.use("/api/v1/collections", collectionRouter);
	app.use("/api/v1/requests", requestRouter);
	app.use("/api/v1/environments", environmentRouter);
	app.use("/api/v1/executions", executionRouter);
	app.use("/api/v1/workflows", workflowRouter);

	app.use(notFoundHandler);
	app.use(errorHandler);
	return app;
}
