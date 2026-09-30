# 2026-09-30 — 0.260.0: Model and effort row accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Model and effort picker row exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.260.0
- Branch and base: `feat/gui-picker-model-label` on `main` (0.259.0)
- Implementation commit(s): fc8cbad
- PR: #461

## Changes and relevant files

- Picker `.picker-model` sets `role="group"` and `aria-label="Model and effort"`.
- Package 0.260.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #461; live-installed on 192.168.1.20 (0.260.0 / fc8cbad42a517867e5e29129834976ab623ede51).
- Archive SHA-256: `e572d23460efc95e35347d76a25e5c5101ea023686549f76838a8c3795060f67`
- Revision: `fc8cbad42a517867e5e29129834976ab623ede51`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.259.0 / revert of #461.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #461 and live-installed 0.260.0.
2. Label projects section heading next.
