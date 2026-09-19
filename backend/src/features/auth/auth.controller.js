import { z } from "zod";
import { authService } from "./auth.service.js";

const registerSchema = z.object({
	name: z.string().trim().min(1).max(80),
	email: z.string().trim().email().max(160),
	password: z.string().min(8).max(200),
});

const loginSchema = z.object({
	email: z.string().trim().email().max(160),
	password: z.string().min(1).max(200),
});

export const authController = {
	async register(request, response, next) {
		try {
			const payload = registerSchema.parse(request.body);
			const { account, token } = await authService.register(payload);
			response.status(201).json({ data: { account, token } });
		} catch (error) {
			next(error);
		}
	},

	async login(request, response, next) {
		try {
			const payload = loginSchema.parse(request.body);
			const { account, token } = await authService.login(payload);
			response.status(200).json({ data: { account, token } });
		} catch (error) {
			next(error);
		}
	},

	async session(request, response) {
		response.status(200).json({ data: { account: request.account } });
	},

	async logout(request, response) {
		response.status(204).send();
	},
};
