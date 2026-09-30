# 2026-09-30 — 0.287.0: Sign out settings section accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign out settings section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.287.0
- Branch and base: `feat/gui-sign-out-section-label` on `main` (0.286.0)
- Implementation commit(s): c692a7e
- PR: #515

## Changes and relevant files

- Sign out settings section sets `aria-label="Sign out"`.
- Package 0.287.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #515; live-installed on 192.168.1.20 (0.287.0 / c692a7ebc4c1841b171716b5753d9fc944f42782).
- Archive SHA-256: `0f524c3a024288ddc06e98b5c8aab92957d401c6c99e20de0c5978e4c4853e46`
- Revision: `c692a7ebc4c1841b171716b5753d9fc944f42782`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.286.0 / revert of #515.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #515 and live-installed 0.287.0.
2. Label account dialog heading next.
