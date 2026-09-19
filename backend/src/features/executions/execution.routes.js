import { Router } from "express";
import { executionController } from "./execution.controller.js";

export const executionRouter = Router();

executionRouter.get("/", executionController.list);
executionRouter.get("/compare", executionController.compare);
executionRouter.get("/:id", executionController.get);
