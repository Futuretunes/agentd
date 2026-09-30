# 2026-09-30 — 0.75.0: Approved Claude and Codex CLI installs

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next administration slice after selected backup restore
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.75.0
- Branch and base: `feat/gui-claude-cli-helper` on `main` (0.74.1)
- PR: #89

## Changes and relevant files

- `scripts/admin_cli.py` / `approve_cli.py` / `run_approved_cli.py`: approve and install Claude (`/opt/claude-code`) and Codex (`/opt/codex`) archives alongside Cursor, same job unit.
- Helper/runner/gateway/mobile/UI accept `claude_*` and `codex_*` approval ids.
- Docs: native CLI updates and administration backlog.

## Validation evidence

- `python3 -B test/admin_cli.py` (run with commit)
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Stage reviewed Claude/Codex archives with `approve_cli.py --adapter …` before phone install.
3. Next backlog: further configuration mutations if toggleable.
