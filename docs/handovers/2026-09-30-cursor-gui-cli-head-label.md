# 2026-09-30 — 0.278.0: CLI dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.278.0
- Branch and base: `feat/gui-cli-head-label` on `main` (0.277.0)
- Implementation commit(s): bfa47fe
- PR: #497

## Changes and relevant files

- CLI dialog `.review-head` sets `role="group"` and `aria-label="CLI heading"`.
- Package 0.278.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #497; live-installed on 192.168.1.20 (0.278.0 / bfa47fea961b925ab366ef4069e70757fbefbc8a).
- Archive SHA-256: `e7279b3859b0660758c619ac556fe5210a8ce26666055ed6748c2307e67bfecf`
- Revision: `bfa47fea961b925ab366ef4069e70757fbefbc8a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.277.0 / revert of #497.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #497 and live-installed 0.278.0.
2. Label diagnostics dialog heading next.
