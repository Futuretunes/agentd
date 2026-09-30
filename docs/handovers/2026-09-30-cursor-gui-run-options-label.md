# 2026-09-30 — 0.143.0: Change model and effort accessible name (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Change model & effort must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.143.0
- Branch and base: `feat/gui-run-options-label` on `main` (0.142.0)
- Implementation commit(s): 084545a
- PR: #226

## Changes and relevant files

- `#run-options` sets `aria-label="Change model and effort"`.
- Package 0.143.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #226; live-installed on 192.168.1.20 (0.143.0 / 084545a).
- Archive SHA-256: `91f0e2f017d8f6a77a2892371c709d80921807f2dbfc481f80746a4572220447`
- Revision: `084545a59c09efe237ea187c5034500edc677eaf`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.142.0 / revert of #226.

## Constraints and known issues

- Visible copy keeps the ampersand; aria-label uses “and”.

## Next steps

1. Done: merged #226 and live-installed 0.143.0.
2. Continue UX polish or admin slices as operator priority allows.
