import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { mockTargetRepository } from "./mock-target.repository.js";

// The mock target authenticates its own callers with a static demo key rather than
// Ahal's own JWT auth - it is standing in for an unrelated third-party API, and a real
// third-party API would not accept Ahal's session tokens. Requests to /secure exercise
// Ahal's "api-key" auth type against something that actually checks it.
const DEMO_API_KEY = "demo-key-123";

const createUserSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.string().trim().email().max(160),
});

const createOrderSchema = z.object({
	userId: z.string().trim().min(1),
	item: z.string().trim().min(1).max(160),
	quantity: z.coerce.number().int().min(1).max(1000).default(1),
	unitPriceCents: z.coerce.number().int().min(0).default(500),
});

export const mockTargetController = {
	health(request, response) {
		response.status(200).json({ data: { status: "ok", service: "ahal-mock-target" } });
	},

	async createUser(request, response, next) {
		try {
			const payload = createUserSchema.parse(request.body);
			const user = await mockTargetRepository.createUser(request.mockOwnerId, payload);
			response.status(201).json({ data: user });
		} catch (error) {
			next(error);
		}
	},

	async listUsers(request, response, next) {
		try {
			response.status(200).json({ data: await mockTargetRepository.listUsers(request.mockOwnerId) });
		} catch (error) {
			next(error);
		}
	},

	async getUser(request, response, next) {
		try {
			const user = await mockTargetRepository.findUser(request.params.id, request.mockOwnerId);
			if (!user) throw new AppError(404, "MOCK_USER_NOT_FOUND", "No mock user with this id.");
			response.status(200).json({ data: user });
		} catch (error) {
			next(error);
		}
	},

	async createOrder(request, response, next) {
		try {
			const payload = createOrderSchema.parse(request.body);
			const user = await mockTargetRepository.findUser(payload.userId, request.mockOwnerId);
			if (!user) throw new AppError(400, "MOCK_USER_NOT_FOUND", "Order references a user that does not exist.");
			const order = await mockTargetRepository.createOrder(request.mockOwnerId, payload);
			response.status(201).json({ data: order });
		} catch (error) {
			next(error);
		}
	},

	async getOrder(request, response, next) {
		try {
			const order = await mockTargetRepository.findOrder(request.params.id, request.mockOwnerId);
			if (!order) throw new AppError(404, "MOCK_ORDER_NOT_FOUND", "No mock order with this id.");
			response.status(200).json({ data: order });
		} catch (error) {
			next(error);
		}
	},

	async confirmOrder(request, response, next) {
		try {
			const order = await mockTargetRepository.setOrderStatus(request.params.id, request.mockOwnerId, "confirmed");
			if (!order) throw new AppError(404, "MOCK_ORDER_NOT_FOUND", "No mock order with this id.");
			response.status(200).json({ data: order });
		} catch (error) {
			next(error);
		}
	},

	// Deterministically failing endpoint for demonstrating failure diagnosis: fails
	// unless the caller opts in with ?succeed=true, so the seeded "known failing" demo
	// request always reproduces the same SERVER_ERROR diagnosis.
	flaky(request, response) {
		if (request.query.succeed === "true") return response.status(200).json({ data: { status: "ok" } });
		response.status(503).json({ error: { code: "MOCK_TARGET_UNAVAILABLE", message: "The mock target is deliberately unavailable for this demo." } });
	},

	secure(request, response) {
		const providedKey = request.get("x-api-key");
		if (providedKey !== DEMO_API_KEY) {
			return response.status(401).json({ error: { code: "INVALID_API_KEY", message: "Provide a valid X-Api-Key header." } });
		}
		response.status(200).json({ data: { status: "ok", scope: "secure-resource" } });
	},

	echo(request, response) {
		response.status(200).json({
			data: {
				method: request.method,
				path: request.path,
				query: request.query,
				headers: request.headers,
				body: request.body ?? null,
			},
		});
	},
};
