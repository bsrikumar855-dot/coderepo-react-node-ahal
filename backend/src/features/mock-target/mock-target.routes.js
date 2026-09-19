import { Router } from "express";
import { mockTargetController } from "./mock-target.controller.js";

export const mockTargetRouter = Router();

// The mock target scopes its demo data by the same account that owns the requests
// pointed at it, resolved from a query param since third-party APIs are not expected
// to understand Ahal's own session tokens. Seeded requests carry ?ownerId={{accountId}}
// so every account gets an isolated sandbox of mock data.
mockTargetRouter.use((request, response, next) => {
	request.mockOwnerId = request.query.ownerId || "000000000000000000000000";
	next();
});

mockTargetRouter.get("/health", mockTargetController.health);
mockTargetRouter.all("/echo", mockTargetController.echo);
mockTargetRouter.get("/flaky", mockTargetController.flaky);
mockTargetRouter.get("/secure", mockTargetController.secure);

mockTargetRouter.post("/users", mockTargetController.createUser);
mockTargetRouter.get("/users", mockTargetController.listUsers);
mockTargetRouter.get("/users/:id", mockTargetController.getUser);

mockTargetRouter.post("/orders", mockTargetController.createOrder);
mockTargetRouter.get("/orders/:id", mockTargetController.getOrder);
mockTargetRouter.post("/orders/:id/confirm", mockTargetController.confirmOrder);
