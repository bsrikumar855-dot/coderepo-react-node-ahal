import { AppError } from "../errors/app-error.js";

/**
 * In-memory fixed-window rate limiter, keyed per account per named bucket.
 *
 * A production deployment of Ahal would back this with Redis so limits hold across
 * multiple API instances; this repo has no Redis in its approved dependency set, so
 * the limiter is scoped to a single process and documented as such in the README.
 * The interface (windowMs, max, key) is what would change to swap the backing store.
 */
const buckets = new Map();

function sweepExpired(now) {
	for (const [bucketKey, entry] of buckets) {
		if (entry.resetAt <= now) buckets.delete(bucketKey);
	}
}

export function rateLimit({ windowMs, max, key }) {
	return (request, response, next) => {
		const now = Date.now();
		if (buckets.size > 5000) sweepExpired(now);

		const accountId = request.account ? String(request.account._id) : request.ip;
		const bucketKey = `${key}:${accountId}`;
		let entry = buckets.get(bucketKey);
		if (!entry || entry.resetAt <= now) {
			entry = { count: 0, resetAt: now + windowMs };
			buckets.set(bucketKey, entry);
		}

		entry.count += 1;
		response.set("X-RateLimit-Limit", String(max));
		response.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));

		if (entry.count > max) {
			const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
			response.set("Retry-After", String(retryAfterSeconds));
			return next(new AppError(429, "RATE_LIMITED", `Too many requests. Try again in ${retryAfterSeconds}s.`));
		}
		next();
	};
}
