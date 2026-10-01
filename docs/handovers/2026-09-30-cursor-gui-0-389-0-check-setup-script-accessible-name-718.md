# 2026-09-30 — 0.389.0: 0.389.0 Check setup script accessible name (#718) (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: 0.389.0 Check setup script accessible name (#718)
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.389.0
- Implementation commit(s): 283d418
- PR: #718

## Changes and relevant files

- See feature PR #718.
- Package 0.389.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #718; live-installed on 192.168.1.20 (0.389.0 / 283d41807d0c1e2a7dc689165262035938dc34d1).
- Archive SHA-256: `0675dfa952c470ff9245aae534259ed2f6d28854d480b3510755f28b35c79da2`
- Revision: `283d41807d0c1e2a7dc689165262035938dc34d1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #718.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #718 and live-installed 0.389.0.
2. Continue a11y form labels.
