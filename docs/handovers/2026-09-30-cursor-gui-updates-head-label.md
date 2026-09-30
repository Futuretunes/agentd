# 2026-09-30 — 0.275.0: Updates dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Updates dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.275.0
- Branch and base: `feat/gui-updates-head-label` on `main` (0.274.0)
- Implementation commit(s): c4d13cd
- PR: #491

## Changes and relevant files

- Updates dialog `.review-head` sets `role="group"` and `aria-label="Updates heading"`.
- Package 0.275.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #491; live-installed on 192.168.1.20 (0.275.0 / c4d13cd39519cc10883ec1cb8594266a2c01d4d2).
- Archive SHA-256: `d10e7ff0f3d28f20f647093a3aa92caae5286f0e7482a2a52c0c81be50e26c9a`
- Revision: `c4d13cd39519cc10883ec1cb8594266a2c01d4d2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.274.0 / revert of #491.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #491 and live-installed 0.275.0.
2. Label configuration dialog heading next.
