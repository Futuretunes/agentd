# 2026-09-30 — 0.321.0: CLI Installed vs tested accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI Installed vs tested section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.321.0
- Branch and base: `feat/gui-cli-installed-tested-label` on `main` (0.320.0)
- Implementation commit(s): d9d3f87
- PR: #583

## Changes and relevant files

- CLI Installed vs tested section sets `aria-label="Installed vs tested"`.
- Package 0.321.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #583; live-installed on 192.168.1.20 (0.321.0 / d9d3f872a36b3810555189e586b5a58fa7588471).
- Archive SHA-256: `2b35c937ae65875b5a8b4cca673804c26ef76ba1ba4f6d349f2e6a62f308db06`
- Revision: `d9d3f872a36b3810555189e586b5a58fa7588471`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.320.0 / revert of #583.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #583 and live-installed 0.321.0.
2. Label Approved CLI packages next.
