import { Router } from "express";
import { requestController } from "./request.controller.js";
import { rateLimit } from "../../shared/middleware/rate-limit.js";

export const requestRouter = Router();

requestRouter.get("/search", requestController.search);
requestRouter.get("/collection/:collectionId", requestController.listByCollection);
requestRouter.post("/", requestController.create);
requestRouter.patch("/:id", requestController.update);
requestRouter.delete("/:id", requestController.remove);
// Executing a saved request makes a live outbound call, so it gets its own, tighter
// rate limit rather than sharing the generous limit CRUD routes get for free.
requestRouter.post("/:id/execute", rateLimit({ windowMs: 60_000, max: 60, key: "request-execute" }), requestController.execute);
