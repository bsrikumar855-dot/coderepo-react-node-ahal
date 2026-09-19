import { Router } from "express";
import { workflowController } from "./workflow.controller.js";
import { rateLimit } from "../../shared/middleware/rate-limit.js";

export const workflowRouter = Router();

workflowRouter.get("/", workflowController.list);
workflowRouter.post("/", workflowController.create);
workflowRouter.patch("/:id", workflowController.update);
workflowRouter.delete("/:id", workflowController.remove);
workflowRouter.get("/:id/runs", workflowController.listRuns);
workflowRouter.get("/:id/runs/:runId", workflowController.getRun);
workflowRouter.post("/:id/run", rateLimit({ windowMs: 60_000, max: 20, key: "workflow-run" }), workflowController.run);
