# Scoped environment permissions

Implemented in v0.19.0. Open **Agent settings** in the desktop or phone interface.

## Inheritance and consent

Settings resolve in this order: installation defaults → project defaults → this agent in the project → conversation defaults → this agent in the conversation. Each field can inherit independently; **Reset this scope to inherited** removes the whole override. Later scopes may widen a project default, but never exceed the installation's supported maximum. This is a single-operator preference hierarchy, not a multi-user authorization system.

Choose **Disable runs**, **Chat only**, **Read-only project access**, or **Allow isolated edits**. The actual run mode can be narrower: permission to edit does not turn an Ask request into an edit. Claude and Cursor support Ask/Edit; Codex supports Chat only. A Chat-only profile therefore prevents Claude/Cursor runs until a compatible profile is selected. The composer disables unavailable modes. Shared defaults can apply across agents; incompatible individual capabilities remain blocked.

The dialog shows effective filesystem/network/tool access and where each field comes from. Saving a scope shows an inline confirmation with the proposed values. Changes are audited with scope, agent, old/new values, actor category and time. Browser identity comes from the authenticated session; clients cannot supply control commands or executable paths. Model metadata discovery is serialized against active work and credential/account changes.

## Queued and running work

Pending runs carry a resolved settings snapshot and fingerprint. Effective changes invalidate approval; a stale browser cannot approve a different snapshot. Dispatch checks again, including after asynchronous credential renewal. Existing completed runs retain their original history; legacy completed runs have no invented snapshot.

Active processes keep their approved settings. Save your changes, choose **Stop active run**, then **Restart with current settings** on the stopped turn. The new attempt preserves uncommitted edits in a snapshot, keeps the original worktree, and requires approval. Existing next-run pins are cleared for this explicit restart so the newly saved settings apply. Unsafe/oversized partial changes or committed/stale turns cannot be restarted this way. Fresh checks and commit/publication approvals remain necessary. Ordinary Retry retains its existing semantics.

Maximum runtime can be 30 seconds to 10 minutes, capped by the administrator's configured timeout. Model/effort/runtime can also be overridden for the next submitted run; access requires a persistent scoped setting.

## Installation ceiling and remaining work

The hardened installation retains isolated worktrees, read-only Git metadata, selected-provider-only outbound access, file-only tools and separate checks/commit/publish approvals. Shell, web, MCP, additional host paths, unrestricted network and native sandbox bypasses are **not** enabled by these controls. Worker credential snapshots still exclude refresh grants. Broader presets require separate implementation and adversarial enforcement tests; they remain on the backlog.

Tests cover inheritance, persistence, stale approvals, credential-preparation races, catalog invalidation, immutable active settings and snapshot-preserving restarts. Existing Linux isolation and provider-egress tests remain mandatory. Desktop/phone fixture testing makes no live model requests.
