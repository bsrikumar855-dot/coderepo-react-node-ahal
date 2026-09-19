import { AppError } from "../errors/app-error.js";
import { authService } from "../../features/auth/auth.service.js";

export async function requireAuth(request, response, next) {
	try {
		const authorization = request.get("authorization") || "";
		if (!authorization.startsWith("Bearer ")) throw new AppError(401, "AUTH_REQUIRED", "Sign in to Ahal to continue.");
		const token = authorization.slice(7).trim();
		if (!token) throw new AppError(401, "AUTH_REQUIRED", "Sign in to Ahal to continue.");
		const { account, payload } = await authService.authenticate(token);
		request.account = account;
		request.auth = payload;
		next();
	} catch (error) {
		next(error);
	}
}
