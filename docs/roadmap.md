# Roadmap

Implemented: project selection and creation, persistent conversations, serial task queue, approval gate, Codex and Claude CLI execution, detached worktrees, mobile text/images, cancellation, SQLite persistence basic metrics, and the hardened worker profile with per-adapter policy and restricted provider networking.

Implemented for the next release: a shared native adapter contract, executable availability discovery, and an Agents panel with explicit unavailable reasons. Discovery does not authenticate or start model work.

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
