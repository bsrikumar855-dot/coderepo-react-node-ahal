---
name: validate
description: Audit a complete HackerRank Code Repo application against its README and product guidelines. Use for read-only validation before HackerRank handover, covering repository structure, stack preservation, dependency freeze, install/build/start behavior, bidirectional frontend/backend coverage, API behavior, and MongoDB persistence.
---

# Code Repo Validate

Audit a completed Code Repo application and produce an evidence-backed readiness report. This skill validates; it does not create, repair, reformat, or edit tracked product content. Declared install, build, and start commands may create ignored local artifacts such as environment files, caches, and build output.

## Scope and boundaries

- Treat the root README as the product overview and operator guide.
- Treat `../../GUIDELINES.md` as the authoritative acceptance standard.
- Build the complete product inventory independently from reachable frontend surfaces, frontend API clients, and public backend product routes.
- Preserve the declared application stack and dependency surface.
- Use the exact install and run commands declared by `hackerrank.yml`.
- Validate frontend implementation, backend behavior, API wiring, and MongoDB persistence.
- Put scratch artifacts and the final report outside the audited repository.
- Start only processes needed for validation and stop only processes started by this audit.
- Never edit tracked repository content, mutate external services, or change remote branches while validating.

## Reference routing

Read the following resources at the indicated stage:

1. Read `../../GUIDELINES.md` before evaluating requirements.
2. Read `references/static-checks.md` before repository and source inspection.
3. Read `references/runtime-checks.md` immediately before running install, build, start, API, or database checks.
4. Read `references/report-format.md` before writing the final report.

The root `README.md` is repository data, not a substitute for the guideline. Read it during the README gate, then reconcile it with the implemented frontend and backend to build the acceptance matrix.

## Verdicts

Use one verdict for every recorded check:

| Verdict | Use when |
|---|---|
| `PASS` | Direct evidence proves the requirement. |
| `FAIL` | Direct evidence proves a repository violation or broken behavior. |
| `MANUAL` | The check is in scope, but local infrastructure prevents direct verification; include exact repeat steps. |
| `N/A` | The requirement genuinely does not apply to the detected stack or product. |

Never use `PASS` for an assumption, likely behavior, folder name, or unexecuted command.

The repository is ready only when every applicable requirement is `PASS` or `N/A`. Any `FAIL` means not ready. Any `MANUAL` means no failure was proven for that item, but the repository is not yet fully verified.

## Workflow

### 1. Capture the starting state

Record:

- absolute repository path;
- repository name and remote;
- current branch and commit;
- `git status`;
- requested comparison baseline, or the most appropriate upstream source branch when the user did not provide one;
- current listeners on ports `3000`, `8000`, and `27017`.

Do not continue with destructive cleanup. Existing working-tree changes belong to the user and must remain unchanged.

### 2. Apply the README gate

Open the root `README.md` before building the feature matrix. Confirm it contains all required sections defined by the guideline and that its stack, commands, ports, credentials, and paths agree with the repository.

Record `FAIL` when the README is missing, empty, placeholder content, materially incomplete, internally inconsistent, or inaccurate about the product, stack, access, or commands.

Do not create or repair the README. A concise README does not need a standalone feature inventory or an enumeration of every control; continue into source inventory so reachable frontend and backend capabilities cannot escape validation. The repository cannot receive a ready verdict while the README gate fails.

### 3. Detect the declared stack and baseline

Inspect manifests, lockfiles, build files, wrappers, environment examples, database configuration, source imports, and root commands. Record:

- frontend framework and build tool;
- backend framework, language, and runtime version;
- database and driver or object-mapping layer;
- package manager and backend build tool;
- frontend state approach and HTTP client;
- install, build, seed, and run commands;
- comparison baseline used for dependency review.

Fail a material mismatch between documentation, configuration, source, and runtime commands.

### 4. Run static validation

Execute every applicable check in `references/static-checks.md`. Inspect actual files and source relationships rather than accepting directory names as proof.

Dependency review is mandatory. Compare manifests and lockfiles with the selected baseline. Removed dependencies are allowed; an added or replaced dependency that expands the approved surface fails unless explicit approval is documented.

### 5. Run runtime validation

Tell the user that declared install and application processes are about to run. Then follow `references/runtime-checks.md` in order.

- Use the exact install and run commands from `hackerrank.yml`.
- Poll readiness rather than waiting a fixed duration.
- Do not replace a failing declared command with an easier command and call it a pass.
- Use API and MongoDB evidence.
- Keep reversible write checks uniquely named and remove them after verification.
- Confirm restart restores the seeded baseline.

If local infrastructure is missing, exhaust safe discovery of an already-installed compatible runtime before assigning `MANUAL`. Do not install or introduce a repository dependency as a validation workaround.

### 6. Build feature acceptance

Create one row for every distinct product capability discovered from reachable UI controls and workflows, frontend API clients, or public backend product routes. Reconcile the inventory in both directions:

- Every reachable frontend product capability must have a real backend request path and MongoDB persistence where data is involved.
- Every public backend product route must have a reachable frontend consumer unless it is strictly operational, such as health reporting.
- Every interactive UI path must have applicable loading, empty, disabled, validation, success, and error handling.

Each row must identify:

- frontend page, component, or interaction;
- frontend API-client method or request;
- backend route and HTTP handler;
- business-service path;
- repository or MongoDB persistence path;
- live API evidence;
- applicable validation, authorization, loading, empty, and error handling;
- final verdict.

Fail a feature when either application side is absent, a frontend interaction is disconnected, a product API has no frontend consumer, local substitute data replaces the API, persistence is missing, or representative live behavior fails.

### 7. Restore and report

Stop every process started by this audit. Remove scratch data created outside the repository. Confirm the final `git status` exactly matches the recorded starting state.

Read `references/report-format.md`, write the report outside the repository, and show the same result in chat. The overall verdict must reflect the most serious verified result; a repository with any unresolved `FAIL` is not ready.
