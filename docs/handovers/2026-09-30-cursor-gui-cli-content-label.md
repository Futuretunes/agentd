# 2026-09-30 — 0.178.0: Agents and CLIs panel accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agents & CLIs dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.178.0
- Branch and base: `feat/gui-cli-content-label` on `main` (0.177.0)
- Implementation commit(s): 76c0688
- PR: #297

## Changes and relevant files

- `#cli-content` aria-label "Agents and CLIs" (keeps aria-live polite).
- Package 0.178.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #297; live-installed on 192.168.1.20 (0.178.0 / 76c0688).
- Archive SHA-256: `87b9f6173f2aecec292a5a0351f22460943a3b46d8b7b305e1200c1e0c34b2b5`
- Revision: `76c0688`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.177.0 / revert of #297.

## Constraints and known issues

- Complements Agents & CLIs dialog heading.

## Next steps

1. Done: merged #297 and live-installed 0.178.0.
2. Continue UX polish or admin slices as operator priority allows.
