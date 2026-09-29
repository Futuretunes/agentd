# 2026-09-29 — In-app updates (Claude, 0.63.0)

- Author/agent: Claude (owner of all work since 2026-09-29; Codex paused).
- Requested outcome: continue the administration backlog. The next work item after access-key rotation and diagnostics is **Settings > Updates**.
- Branch: `feat/gui-updates`, based on `release/0.62.2` (0.62.3 installed).

## Design

Updates flow through five layers, each with its own checks:

1. **Approved releases** live in root-only `/var/lib/agentd-releases/<version>.{tar.gz,json}`. They are created by `scripts/approve_release.py`, which verifies the archive and never replaces an approval with different content.
2. **Gateway** (`/api/updates`): the list is read-only. Preview and install require the current access key and share the sign-in rate limit. Install also requires the matching 5-minute preview fingerprint and `confirmed: true`. Only the version is forwarded.
3. **Runner** (`admin-updates`, `admin-update-start`): refuses via the new `update` admission row (tasks, queue, preparations, account/renewal/probes, dependency/repository/publication/GitHub, models, review preparation). Audited.
4. **Administration helper** (`updates`, `update-start`): exact fields; the version must match `x.y.z`. It re-checks approved, valid, newer, clean configuration and no running job, then runs `systemctl start --no-block agentd-update@<version>.service`. The helper sandbox is unchanged; a probe confirmed it may start units.
5. **Job** (`deploy/agentd-update@.service` running `scripts/run_approved_update.py`): re-verifies the approval and archive and refuses anything not newer. It extracts to a private staging directory, runs the release's `update.py plan` and `install`, then the installed `apply_*` verifications. It writes `update-status.json` (fixed messages, failed stage) and a root-only `update-<time>.log`.

The UI (Settings > Updates) shows the installed version, the last result (honest per stage: nothing changed, rolled back, or installed with a failed check), and newer approved releases with notes and a database-change flag. It then walks through review (key, preview), confirmation, install and progress polling. Services restart and the operator is signed out; the result is shown after signing in again.

`scripts/apply_updates.py` enables the feature on a host. It installs the job unit and the releases directory and records the baseline. It restarts nothing.

## Validation

- Python `test/in_app_updates.py`: approval (idempotent, conflict refused, digest mismatch); approved-release checks (bad versions, tampering, foreign owner); job (plan, install, verifications, status and permissions, staging removed; older release refused; failed stage recorded with no paths); listing (newer, valid, schema change, invalid record, status sanitized).
- Node `test/in-app-updates.test.mjs`: the helper starts only the fixed unit for an approved newer release and refuses bad versions, not-newer, invalid, running and drift cases. `test/mobile.test.mjs` covers the gateway flow (wrong key, not newer, confirmation, wrong fingerprint, replay refused, owner bound).

## Not yet

Rollback from the app (next item), CLI updates, backups page.
