# 2026-09-30 — 0.375.0: Activity agent account card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity agent account card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.375.0
- Implementation commit(s): 49e69f2
- PR: #690

## Changes and relevant files

- See feature PR #690.
- Package 0.375.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #690; live-installed on 192.168.1.20 (0.375.0 / 49e69f258c10a04ba354601ce33cec93a364deb0).
- Archive SHA-256: `fecf39547d7472963f287d51f5e8e21f240efa5cf3227551b5853ec7e84578eb`
- Revision: `49e69f258c10a04ba354601ce33cec93a364deb0`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #690.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #690 and live-installed 0.375.0.
2. Continue a11y form labels.
