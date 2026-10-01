# 2026-09-30 — 0.556.0: Attention status underline (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Attention status underline
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.556.0
- Implementation commit(s): b4d9457
- PR: #1046

## Changes and relevant files

- See feature PR #1046.
- Package 0.556.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1046; live-installed on 192.168.1.20 (0.556.0 / b4d9457f170dcd6a9418f8ef1f319c8aa629efaa).
- Archive SHA-256: `c40ddc32f087f0b038bda245cbbf2cb5dd082e0b8c8e20afdedfc4058bff6bd0`
- Revision: `b4d9457f170dcd6a9418f8ef1f319c8aa629efaa`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1046.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1046 and live-installed 0.556.0.
2. Continue a11y form labels.
