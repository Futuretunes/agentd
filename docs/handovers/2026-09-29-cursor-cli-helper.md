# 2026-09-29 — 0.72.0: approved Cursor CLI install helper

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next administration slice after TLS replacement
- Status: implemented; live-installed as 0.72.1 on 192.168.1.20
- Release: 0.72.0 / follow-up 0.72.1
- Branch and base: `feat/gui-cli-binary-helper` on `main` (0.71.0)
- PR: #82

## Changes and relevant files

- `scripts/admin_cli.py` / `approve_cli.py` / `run_approved_cli.py` / `apply_cli.py`: list approved Cursor packages, approve archives into `/var/lib/agentd-cli`, install via `agentd-cli-install@.service` into `/opt/cursor-agent/<version>` with managed symlink update.
- Admin helper/client/runner/gateway/mobile: `admin-cli` / `admin-cli-install` with step-up preview.
- Settings > Agents & CLIs: approved package list and install flow.
- `run_approved_update.py` runs `apply_cli.py` after ordinary updates so the job unit enables automatically.
- Docs mark 0.71.0 live-installed.

## Validation evidence

- Local typecheck/format and `python3 -B test/admin_cli.py` pending with commit.
- CI pending on push.

## Next steps

1. Merge when CI is green; live-install and run `apply_cli.py` once if not auto-applied.
2. Stage a reviewed Cursor archive with `approve_cli.py` before phone install.
3. Next: Claude/Codex approved helpers or restore workflows.
