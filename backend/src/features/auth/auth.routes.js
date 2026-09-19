import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "../../shared/middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/session", requireAuth, authController.session);
authRouter.post("/logout", requireAuth, authController.logout);
