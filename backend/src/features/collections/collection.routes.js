import { Router } from "express";
import { collectionController } from "./collection.controller.js";

export const collectionRouter = Router();

collectionRouter.get("/", collectionController.list);
collectionRouter.post("/", collectionController.create);
collectionRouter.patch("/:id", collectionController.update);
collectionRouter.post("/:id/archive", collectionController.archive);
collectionRouter.post("/:id/unarchive", collectionController.unarchive);
collectionRouter.delete("/:id", collectionController.remove);

collectionRouter.get("/:id/folders", collectionController.listFolders);
collectionRouter.post("/:id/folders", collectionController.createFolder);
collectionRouter.patch("/:id/folders/:folderId", collectionController.updateFolder);
collectionRouter.delete("/:id/folders/:folderId", collectionController.removeFolder);
