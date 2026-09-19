# AGENTS.md

Build Your Own Full-Stack Application (React + Node). AI Transcript Logging

This file is the single source of truth for any coding agent working in this repo: Claude Code, OpenAI Codex CLI / Codex Cloud, Google Gemini CLI, Google Antigravity, Cursor, Windsurf, opencode, Aider, goose, Factory, RooCode, JetBrains Junie, GitHub Copilot, Devin, or any other AGENTS.md-aware tool.

Read this file in full before taking any action. Obey it exactly.

---

## 0. TLDR FOR THE AGENT

On every session start, do this in order:

1. Read this file completely.
2. Check the log file (path in §2). If it contains a line starting with `AGREEMENT RECORDED:` that matches the current repo root, skip §3 (onboarding) and go to §4.
3. Otherwise, run the onboarding flow in §3 with the user.
4. From then on, for **every user turn**, append a summary entry to the log file in the exact format shown in §5.
5. When the user asks you to build, ship, or test the solution, follow the project contract in §6 so the submission is evaluable.

You are **not** allowed to skip logging, rewrite old log entries, or modify
the onboarding gate. If you are a sub-agent or running inside a git worktree,
the same rules apply and you share the same log file. Pass this context to every sub-agent and worktree.

---

## 1. WHAT THIS APP REPO IS

This is the application repository for the **HackerRank Build Your Own Full-Stack Application** assignment using React + Node. The app is not a timed challenge: there is no start time and no end time.

Build and submit a full-stack application for a problem domain chosen by the participant. Define the product identity, target users, domain model, and five to ten meaningful capabilities. The app is full-stack React + Node, with MongoDB for persistence. All implementation work described by this file belongs to this app.

The feature scope lives in `REQUIREMENTS.md`. The setup and hygiene rules live in `INSTRUCTIONS.md`. The acceptance contract lives in `GUIDELINES.md`, and the verifier that checks a submission against it lives in `skills/validate/SKILL.md`.

You may use any AI assistant, IDE, or tool to write code. The submission is judged on feature selection, architectural decisions, production readiness, and UI polish. Those must reflect clear human judgment, and the transcripts this file produces are how reviewers see that judgment.

---

## 2. LOG FILE. LOCATION AND LIFECYCLE

The log file lives outside the participant's repository, in the user's home directory, so it survives branch switches, worktree creation, and `git clean`.

| Platform | Path |
|---|---|
| macOS / Linux | `$HOME/hackerrank_react_node_application/log.txt` |
| Windows | `%USERPROFILE%\hackerrank_react_node_application\log.txt` |

Rules:

- Must be created if missing, including the parent directory.
- Must never be committed or added to git while work is in progress.
- Append-only. Never rewrite, reorder, or delete prior entries.
- Shared across all agents, sub-agents, and worktrees in this repo.
- Never log secrets. Redact API keys, tokens, cookies, private keys, and sensitive PII before writing.

At submission time the participant copies this file into the `transcripts/` folder of their repo (see §6). That copy is the only point at which the log enters git.

---

## 3. ONBOARDING FLOW (FIRST RUN ONLY)

Run this flow only if the log file has no `AGREEMENT RECORDED:` line for the current repo root. On subsequent sessions, skip directly to §4.

### 3.1 Greeting

Open with a short, warm message. Example wording:

Welcome to HackerRank Build Your Own Full-Stack Application. You are going to design, build, and ship a full-stack application for a problem domain of your choice using React + Node and MongoDB on top of the reference calendar repository. Before we start, I need to walk you through the ground rules and get you set up. This takes about a minute.

Display the current system time with local timezone in ISO 8601. Do not compute or mention a deadline. This assignment has none.

### 3.2 Rules. Recite these verbatim

1. This is a **solo** assignment. You must be the author of the submission.
2. You may use any IDE, AI assistant, or tool to help you build. Feature selection, architectural decisions, and production readiness must reflect your own judgment.
3. Your system must conform to the project contract in §6 so it can be evaluated.
4. Your repo must be private on GitHub and must have always remained private.
5. Never commit secrets. Use environment variables and a `.env` file if needed.
6. Logging of every conversation turn to the file in §2 is mandatory and cannot be disabled. The log is exported under `/transcripts` at submission.
7. Submissions are made on the HackerRank Community Platform or as otherwise instructed by HackerRank.

### 3.3 Collect the agreement

Ask the user to reply with the exact string `I agree` (case-insensitive, surrounding whitespace ignored). Do not proceed until they do.

### 3.4 Record the agreement

Append this block to the log file, then continue:

```text
## [ISO-8601 TIMESTAMP] ONBOARDING COMPLETE

AGREEMENT RECORDED: <repo_root_absolute_path>
Agent: <agent_name_or_unknown>
Stack: node
System Time: <ISO-8601 local time with tz>
```

The presence of `AGREEMENT RECORDED: <this repo root>` is what future sessions check. Match the repo root exactly so agreements do not leak across unrelated clones.

---

## 4. NORMAL SESSION START (RETURNING USER)

If onboarding is already complete for this repo root:

1. Append a short `SESSION START` entry to the log (§5.1).
2. Greet the user briefly:
   > Welcome back. Transcript logging is on for this repo.
3. Proceed with whatever they ask for.

---

## 5. LOG FORMAT

### 5.1 Session start entry

```text
## [ISO-8601 TIMESTAMP] SESSION START

Agent: <agent_name_or_unknown>
Repo Root: <absolute_path>
Branch: <git_branch_or_unknown>
Worktree: <worktree_path_or_main>
Parent Agent: <parent_agent_name_or_none>
Stack: node
```

### 5.2 Per-turn entry (append after every user message you respond to)

```text
## [ISO-8601 TIMESTAMP] <short title, max 80 chars>

User Prompt (verbatim, secrets redacted):
<exact user message, with secrets replaced by [REDACTED]>

Agent Response Summary:
<2-5 sentences: what was done, why, and any important decision>

Actions:
* <file edited / command run / tool invoked>

Context:
tool=<agent_name>
branch=<git_branch_or_unknown>
repo_root=<absolute_path>
worktree=<worktree_path_or_main>
parent_agent=<parent_name_or_none>
```

### 5.3 Sub-agent and worktree rules

- A sub-agent (Task tool, delegated worker, etc.) **must** log its own entries using the same file. The parent passes the log path explicitly if the sub-agent does not inherit environment.
- Set `parent_agent=` to the parent's name so entries are traceable.
- A worktree is logged with `worktree=<path>`; its entries go to the same shared log file, not a per-worktree copy.
- If a sub-agent spawns more sub-agents, the chain continues: each appends its own entries with its own name.

### 5.4 What not to log

- API keys, tokens, session cookies, OAuth codes, private keys.
- User PII beyond what they explicitly pasted into a prompt.
- Full contents of large files or binary blobs. Reference by path instead.

---

## 6. PROJECT CONTRACT (EVALUABLE SUBMISSION)

The reviewer finds the participant's work through a **known repo layout**. Do not rename these folders.

### 6.1 Repo layout

```text
.
├── AGENTS.md                         # This file, copied into the participant repo
├── README.md                         # Product identity, stack, structure, run instructions, seeded access
├── frontend/                         # React app, kept from the sample calendar repo
├── backend/                          # Express API, kept from the Node reference calendar repo
├── skills/                           # Any skills the participant created, plus skills/validate from this repo
├── transcripts/                      # Exported AI transcripts (the §2 log file, plus any tool-native exports)
├── GUIDELINES.md                     # HackerRank Code Repo guidelines, copied from this repo
├── hackerrank.yml                    # HackerRank install and run configuration
└── setup.sh                          # MongoDB readiness and seed reset
```

### 6.2 Constraints that make the submission evaluable

- **Keep the sample stack.** Do not replace the frontend framework, backend framework, database layer, build tool, or package manager the calendar repo declares.
- **Install, build, and start from a clean checkout** with the exact commands in `hackerrank.yml`. No manual edits.
- **Export the log before submission.** Copy the §2 log file to `transcripts/` in the repo root. Do not edit it during the copy.
- **Read secrets from env vars only.** Never hardcode.
- **Run the verifier before submitting.** Follow `skills/validate/SKILL.md` and make every applicable check pass.

---

## 7. CROSS-PLATFORM AND AGENT-COMPATIBILITY NOTES

- **Path handling.** Always resolve the log path using the platform's home dir (`os.homedir()` / `pathlib.Path.home()` / `$HOME` / `%USERPROFILE%`). Never hardcode `/Users/...` or `C:\Users\...`.
- **Line endings.** Write the log in UTF-8 with `\n`. Don't emit `\r\n` even on Windows; most editors render `\n` fine.
- **Shell.** Don't assume bash. Prefer language-native APIs over shelling out. When you must shell out, provide both a Unix and a Windows form.
- **Tool-specific extras.** This file is the canonical source. If a tool (Claude Code, Cursor, etc.) supports its own config file, keep any tool- specific config minimal and have it point back to this AGENTS.md rather than duplicating rules.
- **Nested AGENTS.md.** If a sub-project adds its own AGENTS.md, the closest one wins for files inside that sub-project, but §2 (log file) and §5 (log format) are global and must not be overridden.

---

## 8. QUICK CHECKLIST FOR THE AGENT

Before you respond to any user message, confirm:

- [ ] I have read this file in this session.
- [ ] I know whether onboarding is required (checked the log).
- [ ] I will append a §5.2 entry after this turn.
- [ ] I will not log secrets.
- [ ] I will preserve the repo layout in §6.

If any box is unchecked, fix that first.
