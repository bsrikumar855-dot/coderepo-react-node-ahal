# Runtime Validation Reference

Use this reference only after static validation identifies the declared commands, ports, credentials, API paths, and database configuration.

## Safety and lifecycle rules

1. Record listeners on ports `3000`, `8000`, and `27017` before starting.
2. Never stop a process that was already running or was not started by this audit.
3. Tell the user before running install or application servers.
4. Use the exact `hackerrank.yml` install and run commands.
5. Poll for readiness with bounded retries; do not rely on a fixed sleep.
6. Put temporary request bodies, responses, logs, and reports outside the repository.
7. Use uniquely named reversible validation data.
8. Remove reversible data and stop started processes during cleanup.
9. Confirm ending `git status` matches the recorded starting state.

If MongoDB or a required language runtime is unavailable, search safely for an already-installed compatible runtime. If none is usable, mark the affected checks `MANUAL` and provide exact repeat steps. Do not install a repository dependency or alter project configuration to make validation easier.

## Checklist

| ID | Check | Execution | PASS evidence | FAIL condition |
|---|---|---|---|---|
| R01 | Declared install | Run the exact `hackerrank.yml` install command from the repository root. | Command exits zero, creates required local environments, installs declared dependencies, and seeds MongoDB. | Command fails, needs manual file edits, or uses an undeclared substitute flow. |
| R02 | Frontend build | Run the existing frontend production-build script from the frontend workspace. | Build exits zero without source, manifest, or lockfile changes. | Build fails, emits unresolved application errors, or changes dependencies. |
| R03 | Backend check | Run the existing backend compile, framework check, or equivalent non-destructive verification. | Backend compiles or configuration check exits zero. | Declared source cannot compile or framework configuration is invalid. |
| R04 | Full start | Run the exact `hackerrank.yml` run command and poll both ports. | Frontend responds on 3000 and backend responds on 8000. | Either service fails, wrong ports are used, or frontend becomes usable before required backend readiness. |
| R05 | Health and MongoDB | Call the documented health endpoint. | HTTP success explicitly reports MongoDB connected. | API is unhealthy, database is disconnected, or health hides database state. |
| R06 | Seed baseline | Query or count all application collections after setup. | Counts and representative content match the documented seed baseline. | Collections are empty, duplicated, incomplete, or inconsistent. |
| R07 | Authentication | Use README credentials, list/select profiles where applicable, and call a protected route with and without authorization. | Login and profile selection succeed; protected request is accepted with valid auth and rejected without it. | Credentials are wrong, tokens fail, profile context fails, or protection is missing. |
| R08 | Feature APIs | Exercise representative read behavior for every product group found through the bidirectional feature inventory. | Responses are successful, use expected shapes, and contain live seeded data. | Route is missing, response shape is inconsistent, or feature data is absent/substituted. |
| R09 | Persistence | Exercise representative create, update, follow-up read, and delete behavior through the API; confirm MongoDB state. | Each operation persists, follow-up reads agree, and cleanup removes the validation record. | Writes are in-memory, follow-up reads disagree, delete fails, or residue remains. |
| R10 | Validation and errors | Send representative invalid input, missing-resource, and unauthorized requests. | Appropriate non-500 statuses and concise errors are returned without stack leakage. | Unexpected 500, ambiguous success, leaked internals, or missing authorization. |
| R11 | Restart reset | Make a reversible state change, restart the exact full application flow, and recheck seed counts/content. | Validation change disappears and the documented baseline is restored. | Ad hoc data survives or baseline changes unexpectedly. |
| R12 | Cleanup | Stop started processes, remove external scratch data, and compare Git state. | Ports are released and ending `git status` equals starting state. | Started process remains, user process is stopped, or repository state changes. |

## API coverage planning

Derive request paths and payloads from the frontend API clients and backend validators. Do not guess undocumented payloads.

At minimum, cover these behavior classes when the product provides them:

- health and database connectivity;
- login, session, profile selection, and logout;
- primary collection reads;
- ranged or filtered reads;
- search;
- people or participant lookup;
- calculations, insights, conflicts, or suggestions;
- one representative create/update/read/delete flow;
- unauthorized, invalid-input, and missing-resource responses.

For each discovered product capability, record at least one live request that proves its backend path is reachable. For a write-heavy feature, code inspection alone is insufficient.

## Persistence procedure

Use a clearly unique name such as `Code Repo validation calendar`. Record the created identifier.

1. Create the record through the public application API.
2. Confirm the success status and response shape.
3. Query MongoDB or the public read API and confirm the stored values.
4. Update a value through the API.
5. Perform a follow-up read and confirm the update.
6. Delete the record through the API.
7. Confirm the record no longer exists.

For R11, create a second reversible record, restart using the exact full run command, and confirm seeding removes it. Do not rely only on the explicit delete from R09.

## Error-path procedure

Choose representative requests that cover:

- no authorization header on a protected route;
- malformed or missing required input;
- invalid identifier or missing resource;
- invalid date or range where applicable;
- an ownership or profile-context boundary where applicable.

Record status code and concise response meaning. Do not store or print full authentication tokens in the report.
