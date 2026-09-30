# 2026-09-30 — 0.209.0: Publication summary accessible name (UX-3 / U2)

- Author/agent: Cursor
- Requested outcome: Publication confirm summary text must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.209.0
- Branch and base: `feat/gui-publication-text-label` on `main` (0.208.0)
- Implementation commit(s): 58ced2b
- PR: #359

## Changes and relevant files

- `#publication-confirm-text` sets `aria-label="Publication summary"`.
- Package 0.209.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #359; live-installed on 192.168.1.20 (0.209.0 / 58ced2b).
- Archive SHA-256: `2f9189895170ea41d1675fbddd073779ad3973920f108a442513633c9c4c67d1`
- Revision: `58ced2b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.208.0 / revert of #359.

## Constraints and known issues

None beyond ordinary HTML labeling.

## Next steps

1. Done: merged #359 and live-installed 0.209.0.
2. Clear phone dialog top safe-area next.
