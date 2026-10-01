# 2026-09-30 — 0.520.0: Dialog tabindex focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog tabindex focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.520.0
- Implementation commit(s): 4f9cf93
- PR: #975

## Changes and relevant files

- See feature PR #975.
- Package 0.520.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #975; live-installed on 192.168.1.20 (0.520.0 / 4f9cf9351ac38b6560352fdfd03ac7e3c1657c0b).
- Archive SHA-256: `fee8b37e90859972d203d39b1206d01867344fd6abb2e0eb16e43468a4e13d95`
- Revision: `4f9cf9351ac38b6560352fdfd03ac7e3c1657c0b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #975.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #975 and live-installed 0.520.0.
2. Continue a11y form labels.
