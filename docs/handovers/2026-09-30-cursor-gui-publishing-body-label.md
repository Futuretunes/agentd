# 2026-09-30 — 0.229.0: Publication body accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication body textarea exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.229.0
- Branch and base: `feat/gui-publishing-body-label` on `main` (0.228.0)
- Implementation commit(s): 177b77c
- PR: #399

## Changes and relevant files

- `#publishing-body` keeps visible Pull request description label and matching `aria-label`.
- Package 0.229.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #399; live-installed on 192.168.1.20 (0.229.0 / 177b77c6b28d576529b776ee80fe73670e776336).
- Archive SHA-256: `ee9feaaf6c264622116da574936f5068a3cb30bfbae2c1c645302c76c3d3f418`
- Revision: `177b77c6b28d576529b776ee80fe73670e776336`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.228.0 / revert of #399.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #399 and live-installed 0.229.0.
2. Continue form control accessible-name polish.
