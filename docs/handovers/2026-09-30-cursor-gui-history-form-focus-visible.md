# 2026-09-30 — 0.480.0: History form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.480.0
- Implementation commit(s): b323ec0
- PR: #896

## Changes and relevant files

- See feature PR #896.
- Package 0.480.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #896; live-installed on 192.168.1.20 (0.480.0 / b323ec0c2f9712718a673d35071933a192bbec6c).
- Archive SHA-256: `39450b44daacf49c579c5e78c3599f9c9b5e7165c823cf40ffd073b5522e0a28`
- Revision: `b323ec0c2f9712718a673d35071933a192bbec6c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #896.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #896 and live-installed 0.480.0.
2. Continue a11y form labels.
