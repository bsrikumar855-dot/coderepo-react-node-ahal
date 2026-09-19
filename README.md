# Ahal - API Reliability Workbench

Ahal is a Postman-style workbench for building HTTP requests, chaining them into
multi-step workflows, and diagnosing why a call failed - not just that it did.
Anyone integrating with an API needs three things a browser and curl don't give
them: a place to save and organize requests, a way to test a multi-call sequence
end to end (create a record, then act on it), and a clear answer to "why did this
break" when a call comes back wrong. Ahal covers all three in one authenticated
workspace, backed by MongoDB, with every execution recorded so failures can be
compared and traced instead of re-run blind.

## Core capabilities

- **Collections, folders, and requests** - organize saved HTTP requests (method,
  URL, params, headers, body, auth) into folders within a collection.
- **Environments** - named sets of `{{variables}}` (base URLs, tokens, keys), one
  active at a time, resolved into any request field at send time.
- **Request execution** - sends a saved request through the active environment,
  substituting variables, applying auth (bearer/basic/API key), and recording a
  full execution record (status, headers, body, timing, size).
- **Assertions** - per-request checks (status code, response time, a header, or a
  JSON body path) evaluated with type-aware comparators, so `"200"` and `200`
  are never silently treated as equal.
- **Workflows** - chain saved requests into a strictly sequential run, extracting
  a value from one step's JSON response (e.g. a created record's id) into a
  variable the next step can use.
- **Execution history & comparison** - a cursor-paginated log of every request and
  workflow-step execution, with a side-by-side comparison view for any two runs.
- **Failure diagnosis** - a deterministic, rule-based classifier that turns a raw
  outcome (timeout, network error, unresolved variable, 4xx/5xx, failed assertion)
  into a plain-language diagnosis with suggested next steps - no external model
  call, so the same inputs always produce the same diagnosis.
- **Local mock target** - a small built-in stand-in API (`/api/v1/mock/...`) that
  seeded requests and workflows call, so the demo works fully offline instead of
  depending on a live third-party endpoint being reachable.

## Technology stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite, plain CSS (no component library) |
| Backend | Node.js + Express 5 |
| Database | MongoDB via Mongoose |
| Package manager / runtime | Bun (workspaces at the repo root) |
| Validation | Zod (request body/query validation on every mutating route) |
| Authentication | Email/password with bcrypt hashing + JWT bearer tokens |

## Project structure

```text
.
├── backend/
│   └── src/
│       ├── app.js                    # Express app: middleware + route wiring
│       ├── index.js                  # Process entrypoint (connects DB, starts server)
│       ├── features/
│       │   ├── auth/                 # Register, login, session (JWT)
│       │   ├── collections/          # Collections + folders
│       │   ├── requests/             # Saved requests, execution entrypoint
│       │   ├── environments/         # Named variable sets, one active at a time
│       │   ├── executions/           # Execution history, assertions, failure diagnosis
│       │   ├── workflows/            # Multi-step chained runs
│       │   └── mock-target/          # Built-in stand-in "third-party" API for demos
│       ├── shared/
│       │   ├── config/               # Env loading, MongoDB connection
│       │   ├── middleware/           # Auth guard, rate limiting, error handling
│       │   ├── errors/               # AppError
│       │   └── utils/                # {{variable}} resolution, JSON path lookup
│       └── scripts/seed.js           # Resets and seeds a demo account + data
├── frontend/
│   └── src/
│       ├── App.jsx                   # Auth gate + tab shell
│       ├── features/
│       │   ├── auth/                 # Login / register screen
│       │   ├── workspace/            # Collections sidebar, request builder, response viewer
│       │   ├── environments/         # Environment manager
│       │   ├── workflows/            # Workflow builder + run viewer
│       │   └── executions/           # History list, detail, and comparison
│       └── shared/                   # API client, formatting helpers, shared UI
├── skills/                           # Repo-local Claude skills
├── transcripts/                      # Exported AI transcript (copied at submission)
├── hackerrank.yml                    # Install/run configuration for the grading platform
└── setup.sh                          # Creates .env files, ensures MongoDB, seeds
```

## Prerequisites

- [Bun](https://bun.sh) 1.x
- MongoDB reachable at `mongodb://localhost:27017` (or set `MONGODB_URI`)

## MongoDB behavior

- The backend refuses to start without a reachable `MONGODB_URI` (see
  `backend/src/shared/config/index.js`); `GET /api/v1/health` reports `"ok"`
  only when the database connection is live, and `"degraded"` otherwise.
- `bun run seed` (invoked by `setup.sh` before every full start) **drops** the
  application's collections and rebuilds a single deterministic seeded baseline:
  one demo account, one environment, one collection of example requests against
  the built-in mock target, one workflow, and the execution history produced by
  actually running those requests once during seeding. Restarting the app via
  the documented flow always returns to this same baseline.

## Run instructions

```bash
bun install && bash setup.sh --seed   # install workspaces, create .env files, seed MongoDB
bun start                             # runs setup.sh --start, then both servers
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (health check at `/api/v1/health`)

## Command reference

| Command | Purpose |
|---|---|
| `bun install` | Install all workspace dependencies |
| `bash setup.sh --seed` | Create `.env` files if missing, ensure MongoDB is reachable, seed the database |
| `bun start` | Run setup, then start backend and frontend together |
| `bun run dev:backend` | Run only the backend, with file watching |
| `bun run dev:frontend` | Run only the frontend dev server |
| `bun run seed` | Re-run seeding directly (resets to the baseline demo data) |

## Seeded access

| Email | Password |
|---|---|
| `demo@ahal.dev` | `password123` |

Signing in as the demo account opens a workspace already containing the
"Ahal Demo API" collection, an active "Local Demo" environment, the
"Provision demo customer" workflow, and execution history including one
request seeded to demonstrate a failed call and its diagnosis.

## Notable design decisions

- **Deterministic failure diagnosis, not a model call.** Diagnosing why a request
  failed is done with an ordered set of rule-based checks
  (`backend/src/features/executions/failure-diagnosis.js`), not an external API -
  the same execution outcome always produces the same diagnosis, and the feature
  has no dependency on a hosted service.
- **Type-aware assertions.** Each assertion type declares whether its comparison
  is numeric or textual and coerces explicitly (`Number(...)` / `String(...)`)
  before comparing, rather than relying on JavaScript's `==`, so a status check
  against `"200"` behaves the same as one against `200`.
- **Workflows run strictly sequentially.** Each step is `await`-ed to completion,
  including persisting its execution record, before the next step starts, and a
  step's extracted variables always take precedence over same-named environment
  variables. Running steps concurrently would let a later step read a variable
  before an earlier step produced it.
- **In-memory rate limiting.** Request/workflow execution endpoints are rate
  limited per account (`backend/src/shared/middleware/rate-limit.js`). This repo's
  approved dependencies don't include Redis, so the limiter is process-local; a
  multi-instance deployment would swap its storage for Redis behind the same
  interface.
- **Local mock target instead of a live third party.** Seeded requests and the
  seeded workflow call `backend/src/features/mock-target`, an in-process stand-in
  API, rather than a real external service, so the product demonstrates request
  execution, chaining, and failure diagnosis without depending on outbound
  internet access being available in the grading environment.
