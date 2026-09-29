# 2026-09-29 — In-app rollback (Claude, 0.64.0)

- Author/agent: Claude (owner since 2026-09-29; Codex paused).
- Requested outcome: next administration item after in-app updates, which is rollback from Settings > Updates.
- Branch: `feat/gui-rollback`, based on `feat/gui-updates` (0.63.1).

## Changes

- **`scripts/run_rollback.py`:**
  - `candidate()` selects the newest completed managed backup with an older release, and requires that release's own `update.config()` to accept today's `update.json`.
  - The job, run as `agentd-rollback@<version>.service`:
    - takes the update lock, refuses pending recovery or drift, re-derives the target (it must equal the instance) and checks idle state;
    - moves the running application and state into a new completed managed backup, then restores copies of the target;
    - rewrites `installed.json`, restarts, requires readiness for the older version and schema, then runs the verifications;
    - clears its journal once restored, and reverts exactly the moved folders on failure while restoring.
- **`backup_retention.records(measure=False)`** lists backups without walking them.
- **`admin_updates.py`** reports `rollback` (available/version/completedAt/schemaChange or reason), and treats rollback jobs as running.
- **Helper** `rollback-start`: `x.y.z` only, and it must equal the offered target, with clean configuration and nothing running. **Runner** `admin-rollback-start`: `update` admission and audit. **Gateway** `rollback-preview` / `rollback`: separate previews from updates, key, confirmation, shared rate limit.
- **UI:** a Roll back section, review, progress and result wording.
- **`apply_updates.py`** installs any missing job unit (update and/or rollback). `update.py` accepts `rollbackUnit`.

## Validation

- Python `test/in_app_rollback.py`: candidate choice, newer backups skipped, incompatible refused; success restores the app and state, keeps the source backup, saves and marks what was running, records the release, and blocks rolling "back" to the newer copy; a readiness failure puts back what was running; a changed target or drift refuses before changes.
- Node: helper rollback tests; gateway flow (an update preview cannot approve a rollback; rollback preview and approve).

## Not yet

Linux validation and deployment are waiting for SSH access: the `mikula` password expired on the host (operator action required). Planned live acceptance: install 0.64.0, enable the rollback unit, then optionally a real rollback to 0.63.1 and reinstall 0.64.0 from the app.
