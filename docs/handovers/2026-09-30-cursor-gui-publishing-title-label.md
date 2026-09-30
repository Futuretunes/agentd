# 2026-09-30 — 0.228.0: Publication title accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication title input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.228.0
- Branch and base: `feat/gui-publishing-title-label` on `main` (0.227.0)
- Implementation commit(s): 1977e4d
- PR: #397

## Changes and relevant files

- `#publishing-title` keeps visible Pull request title label and matching `aria-label`.
- Package 0.228.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #397; live-installed on 192.168.1.20 (0.228.0 / 1977e4d0b491fd5a56d823ae56c29ff91ed34583).
- Archive SHA-256: `4e1845b8fb12edd9439d0ad83a15bfb32dafbe1bcbe63fa01831b602a8772d20`
- Revision: `1977e4d0b491fd5a56d823ae56c29ff91ed34583`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.227.0 / revert of #397.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #397 and live-installed 0.228.0.
2. Label publishing body textarea next.
