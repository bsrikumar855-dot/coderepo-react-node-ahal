# Validation Report Format

Write the final report outside the audited repository. Prefer a dedicated validation-results directory when multiple repositories are being audited. Show the same verdict and material findings in chat.

## Writing rules

- Lead with readiness and the largest blocker, if any.
- State the exact repository, branch, commit, baseline, detected stack, guideline path, and date.
- Keep evidence specific: include commands, paths, ports, counts, routes, status codes, or observed values.
- Do not claim broader coverage than was performed.
- Never include secrets, full authentication tokens, or unnecessary response bodies.
- Count every verdict consistently in the summary.
- Order failures by product and review impact rather than discovery order.
- A feature failure outranks formatting or minor documentation polish.

## Required report sections

| Section | Required content |
|---|---|
| Title | `Code Repo Validation Report`. |
| Audit context | Repository, branch, commit, comparison baseline, detected stack, guideline path, and date. |
| Verdict | One direct sentence stating whether the repository is ready and naming the largest blocker. |
| Results | One row for every static and runtime check with ID, verdict, and concise direct evidence. |
| Feature acceptance | One row for every product capability discovered from the reachable frontend, frontend API clients, or backend routes, with frontend, API, backend, persistence, runtime evidence, and verdict. |
| Summary | Total counts for `PASS`, `FAIL`, `MANUAL`, and `N/A`, plus a one-sentence coverage statement. |
| Failures to fix | Unresolved failures ordered by impact, each with location, evidence, and required outcome. |
| Manual checks | Exact commands and expected evidence for every `MANUAL` item. State `None` when empty. |
| Cleanup | Confirmation that started processes were stopped, temporary data was removed, and Git state was restored. |

## Results table schema

Use these columns:

| ID | Area | Verdict | Evidence |
|---|---|---|---|

Use the IDs from `static-checks.md` and `runtime-checks.md`. Do not merge unrelated requirements into a single result merely to shorten the report.

## Feature acceptance table schema

Use these columns:

| Feature | Frontend surface | Frontend request | Backend path | Persistence | Runtime evidence | Verdict |
|---|---|---|---|---|---|---|

Use concise user-outcome labels. Split independently meaningful capabilities and include every feature discovered from the implemented UI, API clients, or backend routes.

## Verdict wording

Ready example: “All applicable static, runtime, feature, and persistence checks passed; the repository is ready for HackerRank handover.”

Failed example: “The repository is not ready because the declared run command does not start the backend; static checks completed, but dependent runtime and feature checks could not pass.”

Manual example: “No repository failure was observed, but MongoDB was unavailable locally, so database-dependent runtime checks remain manual and the repository is not yet fully verified.”

## Failure entry requirements

Each failure must answer:

1. What requirement failed?
2. What direct evidence proves it?
3. Where is the relevant file, command, route, or behavior?
4. What outcome is required to pass?

Do not prescribe a new library, framework, or stack migration as the fix.

## Completion check

Before delivering the report, verify:

- every checklist ID has a verdict;
- every discovered product capability has an acceptance row;
- summary counts equal the tables;
- every `FAIL` appears under failures to fix;
- every `MANUAL` appears with exact steps;
- no credential or token is exposed;
- report path is outside the audited repository;
- chat summary matches the written report.
