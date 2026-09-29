# Administration section — requirements (backlog)

Status: implemented and installed are access-key rotation (0.61), read-only
diagnostics (0.62), in-app updates of approved releases (0.63) and rollback
(0.64/0.64.1, see
[managed updates](managed-updates.md#in-app-updates-settings--updates-since-0630)).
Operator live-accepted 0.64.1 install and rollback to 0.64.0 on 2026-09-29.
Implemented in candidate 0.65.0: approval-gated restart of the task runner or phone
gateway from Diagnostics, with step-up access-key preview, idle admission and helper-side
configuration/update guards. Open, in order: CLI updates; backups; configuration pages. This expands roadmap item 6 ("GUI administration") and the core requirement of
[terminal-free operation](roadmap.md#core-product-requirement-terminal-free-operation).

## What the operator asked for

> Updating from the interface itself, changing the app secret from the interface, and a general app configuration section or "backend" where all these things can be managed.

Today these need SSH and sudo:

- running `/home/c0d3x/agentd-update-*.sh` or `scripts/update.py`;
- rotating the access key in `/etc/agentd-web/mobile.json`;
- editing systemd drop-ins.

## Scope: one Administration area in Settings

Settings gains an **Administration** section, visible only to the signed-in operator. It has these sub-pages:

1. **Updates**
   - Installed version, commit, install date and the last update result.
   - Available **reviewed** releases, with version, short changelog, required schema change and review status (link to the review/handover).
   - **Install**. First a preview step runs the installer's `plan`: it shows the configuration check, idle state, schema change and whether the release is newer. After explicit confirmation, `install` runs, with live progress (tests, backup, swap, readiness) and the result.
   - **Roll back** to the last backup, with a clear warning that newer task data from after that backup is discarded.
   - Downgrades are refused unless explicitly chosen as a rollback.
2. **Access key** (the "app secret")
   - Change the key: generate a strong random key shown **once**, with a copy button and a "saved it in my password manager" confirmation, or enter a new one that passes a strength check.
   - Requires the current key again.
   - Stores only the hash, signs out all other sessions, and records an audit event.
   - Offers to delete the leftover plaintext recovery file (review finding O2).
3. **Service status and diagnostics**
   - Health, uptime, service states, resource-limit status, configuration-drift status and recent errors.
   - Restart the gateway or runner (refused while work is active, unless stopping it is confirmed).
4. **Agents and CLIs:** installed native CLI versions against the tested versions, and guided CLI updates (roadmap item 6).
5. **Backups:** list, retention policy, and restore with a preview (roadmap item 7). This merges with the existing approval-gated storage cleanup.
6. **Configuration:** enabled agents and edit permissions, resource profile, gateway hardening status, the TLS certificate (expiry, replace), notifications (roadmap item 5) and the GitHub connection. Each shows the current value, what changing it affects, and needs confirmation.

## Security model (non-negotiable)

The browser and the web gateway must never gain root or shell access. Today the GUI deliberately has no sudo or update endpoint (`docs/managed-updates.md`).

- **Privileged helper.** A separate, narrowly scoped root helper (for example a socket-activated `agentd-admin.service`) accepts only a fixed list of operations:
  - update plan/install of an _approved_ release, and rollback;
  - access-key rotation;
  - service restart;
  - the other listed configuration changes.

  Each operation has typed, allowlisted parameters. It never accepts commands, paths or arbitrary archives from the browser. The runner forwards requests; the gateway cannot talk to the helper directly.

- **Approved releases only.** The GUI installs only releases placed in a root-owned "approved releases" location with a recorded SHA-256, put there by the review process. Signed release provenance is still open and should be added before or with this feature.
- **Re-authentication.** Every administrative action needs the current access key again (step-up confirmation), and short-lived confirmation tokens bound to the exact previewed plan. That is the same pattern as run approvals: a changed plan needs a fresh preview.
- **Same safeguards as the terminal.** The helper runs the existing `update.py` / `apply_*.py` code paths: idle check, drift refusal, backup, readiness check, rollback. The GUI adds no bypass.
- **Everything audited:** who, when, which plan or fingerprint, and the result. Secrets are never logged or echoed.
- **Recovery without the GUI.** If the web gateway is down, the documented terminal procedure still works.

## Acceptance criteria

- The operator can update to a reviewed release, roll back, rotate the access key and see service health from the phone without SSH.
- A broken or interrupted update leaves a clear state in the GUI (pending recovery) and does not lock the operator out.
- Tests cover:
  - helper operation allowlist and parameter rejection;
  - refusal of unapproved or tampered archives and downgrades;
  - step-up authentication;
  - session invalidation after key rotation;
  - rollback.
- Independent review of the helper before it is installed.

## Suggested order

1. Access-key rotation (small; also closes O2).
2. The read-only diagnostics page.
3. The privileged helper with update plan/install/rollback of approved releases.
4. The remaining configuration pages.

## Candidate 0.61.0: access-key rotation

Settings now offers a generated or strength-checked custom replacement with a
five-minute, browser-session-bound preview. The current key is required for both
preview and approval, and approval requires confirmation that the replacement
was saved. Generated plaintext is returned once; preview state retains only its
hash.

The gateway forwards the exact approved digest through the unprivileged runner
to a dedicated root helper on a private Unix socket. The helper accepts only
access-key rotation, verifies the current key against the root-owned file and
atomically replaces only `accessHash`. It has no network and can write only
`/etc/agentd-web`. The gateway cannot reach its socket. Success keeps the
approving browser session, closes all other sessions and audits no key material.

The helper is installed by an explicit one-time privileged migration after the
managed application update. Reviewed updates/rollback, CLI updates, backups and
configuration editing remain future slices.

## Candidate 0.62.0: safe diagnostics

Settings now shows a read-only server report with the installed release, managed
configuration state, fixed AgentD unit states and restart counts, service uptime,
storage capacity and up to ten recent failed or interrupted runs. Failed-run
details pass through the existing public error sanitizer.

The root helper runs one fixed Python probe with no browser-supplied arguments.
It reads only the managed installer inventory, fixed systemd unit properties and
filesystem capacity. It cannot access task state, project worktrees or native
account profiles, and it returns no journals, prompts, raw logs, environment,
configuration contents, credentials or private paths. The unprivileged runner
adds only task IDs, state, update time and sanitized error summaries. The GUI can
download the same bounded JSON report it displays.

Read-only diagnostics do not restart or change anything and therefore require a
signed-in workspace session without a second key prompt. Service restart and all
other administrative mutations retain the preview, step-up and audit requirement.
