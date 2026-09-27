# Hardened worker profile

This profile preserves the host's user-namespace restrictions and Codex's own sandbox. On the current Ubuntu VM, a second namespace inside bubblewrap is denied. Codex is therefore disabled in this profile, for both Ask and Edit, until a compatible isolation design is validated. There is no automatic unsandboxed retry.

Configure the daemon with:

```
AGENTD_STRICT_WORKERS=1
AGENTD_ENABLED_ADAPTERS=claude
AGENTD_EDITING=1
AGENTD_EDIT_ADAPTERS=claude
```

The adapter policy applies to creation, approval and dispatch, including previously queued tasks. The phone exposes only enabled choices. Existing conversations and outputs remain accessible.

## Worker boundary

Workers receive the selected worktree, read-only Git metadata, selected system runtime files, application worker code, and a temporary home. Other project directories, daemon state, logs, control sockets and original home profiles are absent. Ask mounts the worktree read-only; Edit allows worktree writes. The installed CLI code is read-only. Only the selected provider's authentication files are copied into the temporary profile. Checks receive no provider credentials and no network relay.

All isolated workers use separate PID, IPC and network namespaces. Native agents reach the host through one mounted Unix socket. An in-namespace relay sets HTTP(S) proxy variables, and a host broker permits CONNECT to port 443 on exact provider hostnames. It rejects private/reserved IP addresses and mixed DNS answers, and pins each connection to the validated address. Direct internet, LAN and host-loopback connections are unavailable. No Git push credentials are supplied.

The systemd service has an empty capability bounding set and `NoNewPrivileges` remains enabled. `ProtectKernelTunables` is intentionally disabled because its mounts below `/proc` prevent Linux from mounting procfs in bubblewrap's unprivileged user namespace. The daemon's dedicated unprivileged account cannot change host kernel tunables. Preflights must use this complete production restriction set.

The initial Claude allowlist is `api.anthropic.com`, `claude.ai`, and `platform.claude.com`. Codex's future compatible profile has a separate list. Destination changes require code review; workers cannot configure the broker. TLS remains end-to-end. Provider login/refresh compatibility must pass the live preflight before deployment.

## Limits

Native agents can access their selected provider credential and any data intentionally mounted into the worktree. Allowed provider services remain a possible data destination. The broker does not inspect encrypted HTTP traffic or guarantee prevention of exfiltration through those services. This is a single-operator POC, not a multi-tenant security boundary. It does not defend against kernel vulnerabilities, add CPU/memory quotas, or replace review of repository code and outputs. Authentication changes made in a temporary worker profile are not persisted; renew subscription login outside a worker when needed.

Approval intents, check requests, commit approvals and cancellations are recorded in the task database without prompts or credentials. Inspect the last 100 entries with `agentctl audit`. These records are local, not tamper-proof, and do not identify separate human users.

## Validation and rollout

`npm run typecheck` and `npm test` cover policy, request parsing, address restrictions and existing workflows. On Linux with bubblewrap, `AGENTD_TEST_ISOLATION=1 npm test` additionally checks write boundaries, hidden state, direct-network denial and the real relay's rejection path.

The deployment preflight must run under the service user's systemd restrictions. Run `node scripts/edit-preflight.mjs --live --claude-only` there to verify an actual subscription-backed edit. This spends a small amount of subscription usage and verifies the expected file instead of trusting the CLI's exit status. Preserve the previous application, configuration and state until this passes. A failed preflight must restore the previous installation, not loosen its security policy.
