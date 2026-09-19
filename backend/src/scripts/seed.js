import dotenv from "dotenv";

dotenv.config({ quiet: true });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createApp } from "../app.js";
import { AccountModel } from "../features/auth/account.model.js";
import { CollectionModel } from "../features/collections/collection.model.js";
import { FolderModel } from "../features/collections/folder.model.js";
import { collectionRepository } from "../features/collections/collection.repository.js";
import { EnvironmentModel } from "../features/environments/environment.model.js";
import { environmentRepository } from "../features/environments/environment.repository.js";
import { ExecutionModel } from "../features/executions/execution.model.js";
import { MockOrderModel, MockUserModel } from "../features/mock-target/mock-target.model.js";
import { RequestModel } from "../features/requests/request.model.js";
import { requestRepository } from "../features/requests/request.repository.js";
import { requestService } from "../features/requests/request.service.js";
import { loadConfig } from "../shared/config/index.js";
import { workflowRepository } from "../features/workflows/workflow.repository.js";
import { WorkflowModel } from "../features/workflows/workflow.model.js";
import { WorkflowRunModel } from "../features/workflows/workflow-run.model.js";
import { workflowService } from "../features/workflows/workflow.service.js";

const config = loadConfig();
const PASSWORD_ROUNDS = 10;
const DEMO_PASSWORD = "password123";
const DEMO_EMAIL = "demo@ahal.dev";

async function clearDatabase() {
	console.log("Clearing existing collections...");
	await Promise.all([
		AccountModel.deleteMany({}),
		CollectionModel.deleteMany({}),
		FolderModel.deleteMany({}),
		RequestModel.deleteMany({}),
		EnvironmentModel.deleteMany({}),
		ExecutionModel.deleteMany({}),
		WorkflowModel.deleteMany({}),
		WorkflowRunModel.deleteMany({}),
		MockUserModel.deleteMany({}),
		MockOrderModel.deleteMany({}),
	]);
}

async function seedAccount() {
	console.log("\nSeeding demo account...");
	const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_ROUNDS);
	const account = await AccountModel.create({ name: "Ahal Demo", email: DEMO_EMAIL, passwordHash });
	console.log(`  Created account ${account.email}`);
	return account;
}

async function seedEnvironment(account) {
	console.log("\nSeeding environment...");
	const baseUrl = `http://localhost:${config.port}/api/v1/mock`;
	const environment = await environmentRepository.create(account._id, {
		name: "Local Demo",
		variables: [
			{ key: "baseUrl", value: baseUrl, enabled: true },
			{ key: "ownerId", value: String(account._id), enabled: true },
			{ key: "apiKey", value: "demo-key-123", enabled: true },
		],
	});
	await environmentRepository.activate(environment._id, account._id);
	console.log(`  Created and activated environment "${environment.name}"`);
	return environment;
}

async function seedCollection(account) {
	console.log("\nSeeding collection and folder...");
	const collection = await collectionRepository.create(account._id, {
		name: "Ahal Demo API",
		description: "Requests against the built-in mock target, showing auth types, assertions, and failure diagnosis.",
	});
	const folder = await collectionRepository.createFolder(account._id, {
		collectionId: collection._id,
		parentFolderId: null,
		name: "Users & orders",
	});
	console.log(`  Created collection "${collection.name}" with folder "${folder.name}"`);
	return { collection, folder };
}

async function seedRequests(account, collection, folder) {
	console.log("\nSeeding requests...");
	const rows = [
		{
			name: "List users",
			method: "GET",
			url: "{{baseUrl}}/users?ownerId={{ownerId}}",
			assertions: [{ type: "status", operator: "equals", expected: 200 }],
		},
		{
			name: "Create user",
			method: "POST",
			url: "{{baseUrl}}/users?ownerId={{ownerId}}",
			bodyType: "json",
			bodyContent: JSON.stringify({ name: "Priya Sharma", email: "priya.sharma@example.com" }, null, 2),
			assertions: [{ type: "status", operator: "equals", expected: 201 }],
		},
		{
			name: "Create order for user",
			method: "POST",
			url: "{{baseUrl}}/orders?ownerId={{ownerId}}",
			bodyType: "json",
			bodyContent: JSON.stringify({ userId: "{{userId}}", item: "Demo widget", quantity: 2, unitPriceCents: 1999 }, null, 2),
			assertions: [{ type: "status", operator: "equals", expected: 201 }],
			tags: ["workflow-step"],
		},
		{
			name: "Confirm order",
			method: "POST",
			url: "{{baseUrl}}/orders/{{orderId}}/confirm?ownerId={{ownerId}}",
			assertions: [
				{ type: "status", operator: "equals", expected: 200 },
				{ type: "body", operator: "equals", path: "data.status", expected: "confirmed" },
			],
			tags: ["workflow-step"],
		},
		{
			name: "Read secure resource",
			method: "GET",
			url: "{{baseUrl}}/secure?ownerId={{ownerId}}",
			auth: { type: "api-key", apiKeyName: "X-Api-Key", apiKeyValue: "{{apiKey}}", apiKeyLocation: "header" },
			assertions: [{ type: "status", operator: "equals", expected: 200 }],
		},
		{
			name: "Known failing call",
			method: "GET",
			url: "{{baseUrl}}/flaky?ownerId={{ownerId}}",
			assertions: [{ type: "status", operator: "equals", expected: 200 }],
			tags: ["intentionally-failing"],
		},
		{
			name: "Echo with variables",
			method: "POST",
			url: "{{baseUrl}}/echo?ownerId={{ownerId}}",
			bodyType: "json",
			bodyContent: JSON.stringify({ note: "Sent from environment {{baseUrl}}" }, null, 2),
			assertions: [{ type: "body", operator: "equals", path: "data.method", expected: "POST" }],
		},
	];

	const created = {};
	for (const row of rows) {
		const request = await requestRepository.create(account._id, { ...row, collectionId: collection._id, folderId: folder._id });
		created[row.name] = request;
	}
	console.log(`  Created ${rows.length} requests`);
	return created;
}

async function seedWorkflow(account, collection, requestsByName) {
	console.log("\nSeeding workflow...");
	const workflow = await workflowRepository.create(account._id, {
		name: "Provision demo customer",
		description: "Creates a user, places an order for them, then confirms it - chained with extracted variables.",
		collectionId: collection._id,
		steps: [
			{ requestId: requestsByName["Create user"]._id, label: "Create user", extract: [{ variableName: "userId", path: "data._id" }] },
			{ requestId: requestsByName["Create order for user"]._id, label: "Create order", extract: [{ variableName: "orderId", path: "data._id" }] },
			{ requestId: requestsByName["Confirm order"]._id, label: "Confirm order", extract: [] },
		],
	});
	console.log(`  Created workflow "${workflow.name}" with ${workflow.steps.length} steps`);
	return workflow;
}

/**
 * Seeded execution history is produced by actually running the demo requests and
 * workflow against a temporary instance of the real API - not written directly to
 * the database - so what a fresh install shows in "Execution history" is exactly
 * what this codebase produces, including the one call seeded to fail on purpose.
 */
async function seedExecutionHistory(account, environment, requestsByName, workflow) {
	console.log("\nRunning demo requests once to populate execution history...");
	const app = createApp();
	const server = await new Promise((resolve, reject) => {
		const instance = app.listen(config.port, "127.0.0.1", () => resolve(instance));
		instance.on("error", reject);
	});
	try {
		await requestService.execute(requestsByName["List users"]._id, account._id, { environmentId: environment._id });
		await requestService.execute(requestsByName["Create user"]._id, account._id, { environmentId: environment._id });
		await requestService.execute(requestsByName["Read secure resource"]._id, account._id, { environmentId: environment._id });
		await requestService.execute(requestsByName["Echo with variables"]._id, account._id, { environmentId: environment._id });
		const failing = await requestService.execute(requestsByName["Known failing call"]._id, account._id, { environmentId: environment._id });
		console.log(`  Recorded intentionally-failing call as ${failing.diagnosis.code}`);
		const runOutcome = await workflowService.run(workflow._id, account._id, { environmentId: environment._id });
		console.log(`  Ran workflow "${workflow.workflowNameSnapshot || workflow.name}": ${runOutcome.run.status} (${runOutcome.run.completedSteps}/${runOutcome.run.stepCount} steps)`);
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}
}

async function seed() {
	try {
		console.log("========================================");
		console.log("Ahal Database Seeding");
		console.log("========================================\n");

		console.log("Connecting to MongoDB...");
		await mongoose.connect(config.mongodbUri);
		console.log("Connected to MongoDB");

		await clearDatabase();

		const account = await seedAccount();
		const environment = await seedEnvironment(account);
		const { collection, folder } = await seedCollection(account);
		const requestsByName = await seedRequests(account, collection, folder);
		const workflow = await seedWorkflow(account, collection, requestsByName);
		await seedExecutionHistory(account, environment, requestsByName, workflow);

		const counts = await Promise.all([
			AccountModel.countDocuments(),
			CollectionModel.countDocuments(),
			FolderModel.countDocuments(),
			RequestModel.countDocuments(),
			EnvironmentModel.countDocuments(),
			WorkflowModel.countDocuments(),
			WorkflowRunModel.countDocuments(),
			ExecutionModel.countDocuments(),
		]);

		console.log("\n========================================");
		console.log("Seeding completed successfully!");
		console.log("========================================");
		console.log("\nCollection counts:");
		console.log(`  Accounts:      ${counts[0]}`);
		console.log(`  Collections:   ${counts[1]}`);
		console.log(`  Folders:       ${counts[2]}`);
		console.log(`  Requests:      ${counts[3]}`);
		console.log(`  Environments:  ${counts[4]}`);
		console.log(`  Workflows:     ${counts[5]}`);
		console.log(`  Workflow runs: ${counts[6]}`);
		console.log(`  Executions:    ${counts[7]}`);
		console.log(`\nDemo account: ${DEMO_EMAIL} | Password: ${DEMO_PASSWORD}`);
		console.log("========================================\n");
	} catch (error) {
		console.error("\nSeeding failed:", error.message);
		console.error(error.stack);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
	}
}

seed();
