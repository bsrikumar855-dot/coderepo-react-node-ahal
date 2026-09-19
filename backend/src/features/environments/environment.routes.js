import { Router } from "express";
import { environmentController } from "./environment.controller.js";

export const environmentRouter = Router();

environmentRouter.get("/", environmentController.list);
environmentRouter.post("/", environmentController.create);
environmentRouter.patch("/:id", environmentController.update);
environmentRouter.delete("/:id", environmentController.remove);
environmentRouter.post("/:id/activate", environmentController.activate);
