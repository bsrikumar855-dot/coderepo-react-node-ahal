import { AppError } from "../../shared/errors/app-error.js";
import { getConfig } from "../../shared/config/index.js";
import { extractSecretValues } from "../../shared/utils/variables.js";
import { workflowRepository } from "./workflow.repository.js";
import { requestRepository } from "../requests/request.repository.js";
import { environmentService } from "../environments/environment.service.js";
import { executionService } from "../executions/execution.service.js";
import { runWorkflowSteps } from "./workflow-runner.js";

async function assertStepsReferenceOwnedRequests(ownerId, steps) {
	if (!steps.length) throw new AppError(400, "WORKFLOW_EMPTY", "A workflow needs at least one step.");
	for (const step of steps) {
		const exists = await requestRepository.findById(step.requestId, ownerId);
		if (!exists) throw new AppError(400, "INVALID_STEP_REQUEST", `Step references a request that does not exist: ${step.requestId}.`);
	}
}

export const workflowService = {
	list(ownerId) {
		return workflowRepository.list(ownerId);
	},

	async get(id, ownerId) {
		const workflow = await workflowRepository.findById(id, ownerId);
		if (!workflow) throw new AppError(404, "WORKFLOW_NOT_FOUND", "This workflow does not exist.");
		return workflow;
	},

	async create(ownerId, payload) {
		if (payload.steps?.length) await assertStepsReferenceOwnedRequests(ownerId, payload.steps);
		return workflowRepository.create(ownerId, payload);
	},

	async update(id, ownerId, updates) {
		if (updates.steps?.length) await assertStepsReferenceOwnedRequests(ownerId, updates.steps);
		const workflow = await workflowRepository.update(id, ownerId, updates);
		if (!workflow) throw new AppError(404, "WORKFLOW_NOT_FOUND", "This workflow does not exist.");
		return workflow;
	},

	async delete(id, ownerId) {
		const workflow = await workflowRepository.delete(id, ownerId);
		if (!workflow) throw new AppError(404, "WORKFLOW_NOT_FOUND", "This workflow does not exist.");
		return { deleted: true };
	},

	listRuns(workflowId, ownerId) {
		return workflowRepository.listRuns(workflowId, ownerId);
	},

	async getRun(id, ownerId) {
		const run = await workflowRepository.findRunById(id, ownerId);
		if (!run) throw new AppError(404, "WORKFLOW_RUN_NOT_FOUND", "This workflow run does not exist.");
		const executions = await executionService.listByWorkflowRun(run._id, ownerId);
		return { run, executions };
	},

	/**
	 * Loads every step's request definition up front (fail fast on a missing or
	 * deleted request, rather than partway through a run), then hands the runner a
	 * strictly sequential list of {definition, extract, continueOnFailure} steps.
	 */
	async run(id, ownerId, { environmentId } = {}) {
		const workflow = await this.get(id, ownerId);
		if (!workflow.steps.length) throw new AppError(400, "WORKFLOW_EMPTY", "This workflow has no steps to run.");

		const requestDocs = await Promise.all(workflow.steps.map((step) => requestRepository.findById(step.requestId, ownerId)));
		const missingIndex = requestDocs.findIndex((doc) => !doc);
		if (missingIndex !== -1) {
			throw new AppError(400, "INVALID_STEP_REQUEST", `Step ${missingIndex + 1} references a request that no longer exists.`);
		}

		const config = getConfig();
		const resolvedEnvironment = await environmentService.resolveVariablesFor(ownerId, environmentId);
		const secretValues = extractSecretValues(resolvedEnvironment.variables);

		const run = await workflowRepository.createRun({
			ownerId,
			workflowId: workflow._id,
			workflowNameSnapshot: workflow.name,
			environmentId: resolvedEnvironment.environmentId,
			status: "running",
			stepCount: workflow.steps.length,
			startedAt: new Date(),
		});

		const steps = workflow.steps.map((step, index) => ({
			definition: requestDocs[index].toObject(),
			extract: step.extract,
			continueOnFailure: step.continueOnFailure,
			label: step.label,
		}));

		const onStepComplete = async (index, step, result) =>
			executionService.recordExecution(ownerId, {
				source: "workflow-step",
				requestId: requestDocs[index]._id,
				requestSnapshot: { name: step.label || requestDocs[index].name, method: requestDocs[index].method, url: requestDocs[index].url },
				environmentId: resolvedEnvironment.environmentId,
				workflowRunId: run._id,
				stepIndex: index,
				result,
				assertions: requestDocs[index].assertions,
				secretValues,
			});

		const outcome = await runWorkflowSteps({ steps, environmentVariables: resolvedEnvironment.variables, timeoutMs: config.requestExecutionTimeoutMs, onStepComplete });

		const finishedRun = await workflowRepository.updateRun(run._id, {
			status: outcome.failedAtStep === null ? "succeeded" : "failed",
			completedSteps: outcome.completedSteps,
			failedAtStep: outcome.failedAtStep,
			runVariables: outcome.runVariables,
			finishedAt: new Date(),
		});

		const executions = await executionService.listByWorkflowRun(run._id, ownerId);
		return { run: finishedRun, executions };
	},
};
