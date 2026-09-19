import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(request, response) {
	response.status(404).json({ error: { code: "NOT_FOUND", message: `Route ${request.method} ${request.path} was not found.` } });
}

export function errorHandler(error, request, response, next) {
	if (error instanceof ZodError) {
		return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Request validation failed.", details: error.flatten() } });
	}
	if (error instanceof AppError) {
		return response.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
	}
	// A route param or body field that looks like a Mongo id but isn't (e.g. "not-an-id")
	// reaches Mongoose as a query, not a validation error, and Mongoose throws a
	// CastError. None of the individual services guard against this - centralizing the
	// conversion here means every "invalid identifier" case in the app returns 400
	// instead of leaking a 500 for what is genuinely bad client input.
	if (error instanceof mongoose.Error.CastError) {
		return response.status(400).json({ error: { code: "INVALID_ID", message: `"${error.value}" is not a valid identifier.` } });
	}
	console.error(error);
	return response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
}
