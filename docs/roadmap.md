# Roadmap

Implemented: project selection and creation, persistent conversations, serial task queue, approval gate, Codex and Claude CLI execution, detached worktrees, mobile text/images, cancellation, SQLite persistence, basic metrics, and the hardened worker profile with per-adapter policy and restricted provider networking.

Also implemented in v0.6.0: a shared native adapter contract, executable availability discovery, and an Agents panel with explicit unavailable reasons. Discovery does not authenticate or start model work.

Implemented in v0.7.0: a read-only Operations Center for desktop and phone. It summarizes service health, queue and task states, recent failures, pending reviews, adapter availability, and normalized native account sign-in state. Provider usage is shown as unavailable unless a native interface can report it reliably. Account checks are cached and their raw output, identities, executable paths, prompts, logs, and worktree paths are excluded from the Operations response.

## Core product requirement: terminal-free operation

The eventual product must let the operator manage everything through the desktop/mobile GUI, without SSH, shell commands, manual file edits, or copying installer output into chat. This is a product acceptance requirement, not just a visual redesign. Current terminal-based administration is temporary.

- **Credits and limits:** show each provider's available usage/credits, reset times, account status and approaching-limit warnings where supported. Distinguish subscription limits from metered balances. Show unavailable or stale information honestly; never invent a balance. Explain when limits block a task and provide a clear next action.
- **Current tasks:** the read-only overview is implemented. Add progress, results, logs, checks, changes, approvals, cancellation and supported retry/resume controls to the GUI.
- **Accounts:** guided Claude/Codex sign-in, sign-out, account selection and reauthentication using supported native/browser flows. Explain expired sessions and verify success. Keep passwords, authorization codes and tokens out of conversations and logs; preserve human control over sign-in and permissions.
- **Projects and operations:** create/import projects, configure supported agents and integrations, review/commit/publish approved changes, install updates, monitor services, and manage backups/restores through guided GUI workflows.
- **Foolproof recovery:** plain-language errors, sensible defaults, disabled actions with explanations, actionable prerequisites and clear success/failure states. Prevent duplicate submissions and accidental destructive actions. Preserve work across failures and offer safe rollback/retry paths instead of terminal instructions.
- **Security stays mandatory:** GUI convenience must not bypass worker isolation, grant agents sudo, expose credentials, or remove approval gates. Administrative actions need a narrowly scoped, authenticated management boundary.

Acceptance: a nontechnical operator can complete the supported setup, sign-in, project/task lifecycle, usage monitoring, update and recovery journeys from the GUI alone. Validate these journeys on a phone as well as desktop, including expired logins, exhausted limits, unavailable providers, interrupted runs and failed updates. External provider availability and manual consent must be explained rather than hidden.

High-priority follow-up:

- Durable Claude session renewal. Refreshes inside disposable workers are currently discarded. Design a trusted credential lifecycle outside repository-controlled workers, handle token rotation and concurrent refresh safely, and test expired sessions without exposing credentials or weakening isolation. Manual service-account sign-in remains the recovery path.
- Restore Codex availability only through a validated solution compatible with the host's namespace restrictions. No inner-sandbox bypass.

Planned, with no release-date commitment:

- Cursor integration through the adapter contract, including installation and native/subscription authentication validation.
- Browser repository import, approved GitHub publishing, broader check profiles and revision requests before committing.
- Further worker credential separation, resource limits and stronger isolation beyond the single-operator profile.
- Structured results, task-specific validation and richer event streams.
- Mobile notifications and approvals through ntfy; durable interrupts and resumable sessions.
- Optional audio capture/transcription with an explicit privacy and cost model.
- Prometheus/Grafana dashboards and Loki/Alloy log integration.
- Alertmanager, Vault, n8n and MCP integration.
- VPN/reverse-proxy deployment, multi-user authentication and authorization.
- Retention, cleanup, migrations, backup/restore and release automation.

A feature listed here is not a promise that the current release supports it.
