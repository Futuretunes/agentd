# 2026-09-30 — 0.230.0: Revision prompt accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Revision prompt textarea exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.230.0
- Branch and base: `feat/gui-revision-prompt-label` on `main` (0.229.0)
- Implementation commit(s): 41f2651
- PR: #401

## Changes and relevant files

- `#revision-prompt` keeps visible What should change? label and sets `aria-label="Revision request"`.
- Package 0.230.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #401; live-installed on 192.168.1.20 (0.230.0 / 41f2651469ee9ed20d7376a8565aac9f9e9460e2).
- Archive SHA-256: `8b3b624f2ac0ae11d8e8fc63c4a8167804eb14d6a34f3d53d23da97bd9bb92f2`
- Revision: `41f2651469ee9ed20d7376a8565aac9f9e9460e2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.229.0 / revert of #401.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #401 and live-installed 0.230.0.
2. Continue form control accessible-name polish.
