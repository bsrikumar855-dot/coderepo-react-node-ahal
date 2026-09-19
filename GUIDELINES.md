# HackerRank Code Repo Guidelines for Complete Applications

## Purpose

These guidelines define the standard for a complete, reviewer-ready HackerRank Code Repo application. The expected deliverable is a self-contained full-stack product that installs, starts, and demonstrates every documented capability without manual repair.

Use this document as the product acceptance contract while creating an application. Use the validation skill after implementation is complete to collect evidence against the contract.

## Core principles

1. **Deliver a product, not disconnected code.** Every documented or reachable product capability must have a usable frontend surface, a backend API flow, and MongoDB persistence where data is involved.
2. **Preserve the declared stack.** The repository's existing manifests, lockfiles, build files, and working application define the approved technology.
3. **Do not expand dependencies.** Use the approved dependencies already present and native platform APIs.
4. **Make setup deterministic.** The declared install and run commands must work from a clean checkout and produce a known seeded state.
5. **Document what is actually delivered.** The root README is a concise product identity, stack summary, and operator walkthrough.

## 1. Product completeness

### 1.1 End-to-end capability

Each capability listed in the README or reachable in the product must span the application:

- The frontend exposes a meaningful page, component, control, or interaction.
- The frontend calls the real backend API for that capability.
- The backend has a route and handler for the request.
- Business rules are implemented outside the HTTP layer.
- Reads and writes use MongoDB rather than substitute local data.
- Loading, empty, validation, authorization, success, and failure outcomes are handled where applicable.

A frontend-only demonstration, an unused backend route, or a hardcoded replacement for live API data is incomplete.

### 1.2 Product feature inventory

The README may remain concise and does not need a standalone feature inventory. Validation discovers the complete product surface from reachable frontend interactions, frontend API clients, and public backend product routes.

Every frontend capability must map forward to backend behavior, and every product backend route must map back to a reachable frontend consumer. Strictly operational routes such as health reporting are exempt from the frontend-consumer requirement. Do not advertise a capability that is not implemented end to end.

### 1.3 Real application data

- MongoDB is the application data source.
- Seed data must be realistic, coherent, and sufficient to demonstrate the product.
- Starting the complete application resets the application database to the documented seeded baseline.
- A restart must remove ad hoc validation data and restore the expected collection counts and content.

## 2. Technology contract

### 2.1 Detect and preserve the stack

Before making product changes, identify the technology already declared by:

- root and workspace manifests;
- dependency lockfiles;
- backend build files and wrappers;
- language and runtime configuration;
- database configuration and driver;
- frontend state and HTTP-client approach;
- setup, development, and production commands.

Treat these files as the technology contract. Do not migrate or replace the frontend framework, backend framework, database layer, language, build tool, package manager, state approach, or HTTP client unless explicit approval is provided.

Repository-specific stack details belong in that repository's README. Do not encode a stack migration as a universal guideline.

### 2.2 Dependency freeze

Do not add or replace any external runtime or development dependency, including a:

- package or library;
- frontend or backend framework;
- plugin or build extension;
- component library;
- state manager;
- HTTP client;
- hosted API or service;
- CDN-hosted runtime asset.

Existing approved and pinned dependencies may remain. Implement new behavior with those dependencies and native language, browser, and framework APIs.

If an additional dependency is genuinely unavoidable, stop before changing a manifest or lockfile and obtain explicit approval.

### 2.3 Package and build tools

- JavaScript workspaces use Bun with one root `package.json`, one root `bun.lock`, and a root workspace installation.
- Do not commit npm, Yarn, or pnpm lockfiles.
- A non-JavaScript backend keeps its existing build tool and wrapper outside the Bun workspace.
- Do not introduce a second build system for the same application layer.

### 2.4 Database technology

- Use MongoDB and preserve the driver or object-mapping layer already present in the repository.
- Do not introduce an SQL database, relational ORM, or relational migration system.
- Keep connection configuration centralized and environment-driven.
- Health reporting must distinguish a running API from a working MongoDB connection.

## 3. Repository design

### 3.1 Repository name

Use `coderepo-{frontend}-{backend}-{appname}` in lowercase with no spaces.

### 3.2 Complete monorepo

Keep the complete product in one repository. Include:

- frontend source;
- backend source;
- database configuration;
- deterministic seed data;
- committed `.env.example` files;
- setup and start commands;
- `hackerrank.yml`;
- debugger configuration;
- root README;
- the pinned dependency graph required by the declared stack.

Never commit secrets or local `.env` files.

### 3.3 Feature-oriented architecture

Organize frontend and backend code by product feature or domain using the declared framework's native conventions.

- React applications use `src/features/` for domain code and `src/shared/` for cross-cutting code.
- Backends may use feature folders, Django apps, Java packages, or the equivalent convention for the existing stack.
- Avoid a repository-wide layer-only tree when the framework supports feature modules.

The conceptual backend request flow is:

```text
route -> controller -> service -> repository -> database
```

Framework naming may differ, but HTTP handling, business rules, and database access must remain separate and grouped with the feature they implement.

### 3.4 Environment and seed setup

- Setup creates missing local environment files from committed examples.
- Setup verifies or starts required local infrastructure when supported.
- Setup installs the backend environment with the declared tool.
- Seed logic clears application collections before inserting the baseline.
- The full start flow runs setup and seeding before both servers become available.
- Seed and database configuration files are protected through `hackerrank.yml`.

### 3.5 Content and media

- Store application media locally in a dedicated asset folder owned by the frontend or backend that uses it.
- Do not load runtime media from an external host or CDN.
- Do not use copyrighted assets, external brands, logos, or trademarked product content.
- Use realistic content rather than placeholder text.
- Use clear, inclusive sample identities and neutral product language.

### 3.6 Git and archive behavior

- Ignore local environments, generated builds, caches, databases, logs, and secrets.
- Keep internal `GUIDELINES.md` and `skills/` out of the HackerRank archive through `.gitattributes`.
- Keep the root `README.md` in the archive as the product and operation walkthrough.
- Keep the exported archive below 5 MB.

## 4. HackerRank runtime contract

### 4.1 `hackerrank.yml`

The file must parse and declare:

- `install`: installs every workspace, prepares backend dependencies, and seeds MongoDB without manual steps;
- `run`: starts the complete frontend and backend application;
- `readonly_paths`: protects seed and database configuration files;
- `default_open_files`: points to existing representative frontend and backend files.

The commands declared in `hackerrank.yml` are authoritative. Validate those exact commands rather than substitutes.

### 4.2 Ports and server access

- Frontend runs on port `3000`.
- Backend runs on port `8000`.
- Servers bind so HackerRank can reach them.
- Frontend proxy or API-base configuration agrees with the backend port and API prefix.
- The backend is ready before frontend features depend on it.

### 4.3 Development reload

- Use Vite's existing frontend reload behavior.
- Use the backend stack's existing watcher or development reloader.
- Do not add a reload package.

### 4.4 Platform-compatible behavior

The core product must not depend on capabilities unavailable in the HackerRank environment, such as outbound email, WebSockets, server-side file uploads, external hosted services, or multiple simultaneous signed-in browser sessions. Use a local, in-product alternative when the product concept requires a similar experience.

### 4.5 Debugging

Commit `.vscode/launch.json` with valid configurations for the actual backend command, source entry point, and port. Every referenced file and command must exist.

## 5. Product quality

### 5.1 Frontend quality

- Use the repository's existing design system and interaction patterns.
- Do not introduce a component library.
- Provide responsive layouts without horizontal page overflow at common mobile and desktop widths.
- Make interactive controls keyboard-accessible and clearly labeled.
- Show useful disabled, loading, empty, validation, success, confirmation, and error states where applicable.
- Keep theme behavior consistent across pages, dialogs, menus, overlays, and recovery states.

### 5.2 Backend quality

- Validate request bodies, parameters, identifiers, ranges, and enumerated values.
- Enforce authentication and profile or ownership authorization consistently.
- Return appropriate non-500 responses for invalid input, missing resources, and unauthorized access.
- Return concise, consistent errors without stack traces or implementation details.
- Keep route handlers thin and place business rules in services.
- Keep database operations in repositories or the declared stack's equivalent persistence boundary.

### 5.3 Code quality

- Remove dead code, unused imports, unused dependencies, generated output, and temporary debugging statements.
- Keep application code self-explanatory and consistently formatted.
- JavaScript uses the existing Prettier configuration without adding ESLint, Husky, or lint-staged.
- Use American English in code, UI content, seed data, logs, and documentation.
- Lifecycle and setup logs may remain when they help operators understand startup state.

## 6. Required README

Every application must have a root `README.md`. It is part of the product deliverable, not optional internal documentation.

The README must contain:

1. **Product identity:** one clear description of the application and its purpose.
2. **Technology stack:** actual frontend, backend, database, runtime, package manager, build tool, validation, and authentication choices.
3. **Project structure:** an annotated tree showing the major frontend, backend, configuration, documentation, and operation paths.
4. **Prerequisites:** required local runtimes and infrastructure.
5. **MongoDB behavior:** connection expectation, seeding, and reset behavior.
6. **Run instructions:** the minimal install and full-start workflow.
7. **Command reference:** every additional documented command and its purpose.
8. **Seeded access:** copyable login credentials and any profile-selection explanation.

The README fails validation when it is missing, placeholder content, materially incomplete, inconsistent with the repository, or claims behavior that cannot be mapped to both frontend and backend implementation.

## 7. Acceptance standard

A repository is ready only when direct evidence supports every applicable item.

### 7.1 Static acceptance

- Repository structure is complete and internally consistent.
- The README passes the required-content gate.
- The detected stack matches its documentation and commands.
- Dependency changes do not expand the approved surface.
- Every reachable frontend capability maps through an API client to backend behavior and persistence where applicable.
- Every public backend product route maps back to a reachable frontend consumer unless it is strictly operational.
- Configuration, debugger paths, and archive rules are valid.

### 7.2 Install, build, and start acceptance

- The exact declared install command succeeds from a clean checkout.
- The frontend production build succeeds with the existing toolchain.
- The backend's native compile or configuration check succeeds.
- The exact run command starts frontend and backend on ports `3000` and `8000`.
- The health endpoint reports a live MongoDB connection.
- No manual environment-file edits are required.

### 7.3 Feature and persistence acceptance

For every product capability discovered from the reachable frontend, frontend API clients, or public backend routes:

- identify the frontend surface;
- identify the frontend API call;
- identify the backend route and handler;
- identify the service and persistence path;
- exercise representative live API behavior;
- verify MongoDB-backed reads and writes;
- verify applicable validation, authorization, empty, loading, and error handling.

Representative create, update, read, and delete flows must persist in MongoDB. Restarting the complete application must restore the seeded baseline.

### 7.4 Completion rule

Do not mark a requirement complete from inference. Use opened source, parsed configuration, successful commands, live API responses, and database observations.

When direct verification is impossible because required local infrastructure is unavailable, record the item as `MANUAL` with exact steps. Do not convert missing infrastructure into a repository failure, and do not call an unverified item `PASS`.

The validation scope covers repository inspection, install, build, start, API behavior, and MongoDB persistence.
