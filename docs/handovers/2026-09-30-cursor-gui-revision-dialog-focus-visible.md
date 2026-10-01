# 2026-09-30 — 0.440.0: Revision dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Revision dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.440.0
- Implementation commit(s): 0bfa11c
- PR: #819

## Changes and relevant files

- See feature PR #819.
- Package 0.440.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #819; live-installed on 192.168.1.20 (0.440.0 / 0bfa11c6cbe695238b725942d5290090d4b4b6f2).
- Archive SHA-256: `80ea698d54b469a9db69691ebf8c7042f0972bb50b1cce8656678b9a441a7b79`
- Revision: `0bfa11c6cbe695238b725942d5290090d4b4b6f2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #819.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #819 and live-installed 0.440.0.
2. Continue a11y form labels.
