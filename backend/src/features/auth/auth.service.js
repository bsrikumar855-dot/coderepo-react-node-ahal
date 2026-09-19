import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../shared/errors/app-error.js";
import { getConfig } from "../../shared/config/index.js";
import { authRepository } from "./auth.repository.js";

const PASSWORD_MIN_LENGTH = 8;

function issueToken(account) {
	const config = getConfig();
	return jwt.sign({ sub: String(account._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export const authService = {
	async register({ name, email, password }) {
		if (password.length < PASSWORD_MIN_LENGTH) {
			throw new AppError(400, "WEAK_PASSWORD", `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
		}
		const existing = await authRepository.findByEmail(email);
		if (existing) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.");
		const passwordHash = await bcrypt.hash(password, 10);
		const account = await authRepository.create({ name, email, passwordHash });
		return { account, token: issueToken(account) };
	},

	async login({ email, password }) {
		const account = await authRepository.findByEmail(email);
		if (!account) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
		const matches = await bcrypt.compare(password, account.passwordHash);
		if (!matches) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
		return { account, token: issueToken(account) };
	},

	async authenticate(token) {
		const config = getConfig();
		let payload;
		try {
			payload = jwt.verify(token, config.jwtSecret);
		} catch {
			throw new AppError(401, "INVALID_TOKEN", "Your session is invalid or has expired.");
		}
		const account = await authRepository.findById(payload.sub);
		if (!account) throw new AppError(401, "ACCOUNT_UNAVAILABLE", "This account is no longer available.");
		return { account, payload };
	},
};
