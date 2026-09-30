# 2026-09-30 — 0.244.0: Active project eyebrow accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Active project eyebrow exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.244.0
- Branch and base: `feat/gui-project-name-label` on `main` (0.243.0)
- Implementation commit(s): 9e402de
- PR: #429

## Changes and relevant files

- `#project-name` sets `aria-label="Active project"` and remains the `aria-describedby` target for `#thread-title`.
- Package 0.244.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #429; live-installed on 192.168.1.20 (0.244.0 / 9e402defbcc430645af8e73d7d30c81413bc8a87).
- Archive SHA-256: `13262a1507d0f8d2700af83d2f074ee228f864bd5e15d4bc653879aae729b7d6`
- Revision: `9e402defbcc430645af8e73d7d30c81413bc8a87`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.243.0 / revert of #429.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #429 and live-installed 0.244.0.
2. Lock Copy code accessible name next.
