# 2026-09-30 — 0.263.0: Review dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.263.0
- Branch and base: `feat/gui-review-head-label` on `main` (0.262.0)
- Implementation commit(s): 9568e7c
- PR: #467

## Changes and relevant files

- Review dialog `.review-head` sets `role="group"` and `aria-label="Review heading"`.
- Package 0.263.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #467; live-installed on 192.168.1.20 (0.263.0 / 9568e7cdb122ac8d992301e5cb2e3f3ce02355e3).
- Archive SHA-256: `ae7e43cb4890fdc1157be14e587fbbf9e1663467094a8ccbb24ba9ebdc771152`
- Revision: `9568e7cdb122ac8d992301e5cb2e3f3ce02355e3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.262.0 / revert of #467.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #467 and live-installed 0.263.0.
2. Label history dialog heading next.
