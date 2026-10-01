# 2026-09-30 — 0.455.0: Conversation menu focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation menu focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.455.0
- Implementation commit(s): a264822
- PR: #848

## Changes and relevant files

- See feature PR #848.
- Package 0.455.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #848; live-installed on 192.168.1.20 (0.455.0 / a2648226b8e32b323c6976b2281882048397e90a).
- Archive SHA-256: `2d51888bb456762c98052f21598dfac3a49e94a0775e5198a0f54f2284ba427f`
- Revision: `a2648226b8e32b323c6976b2281882048397e90a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #848.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #848 and live-installed 0.455.0.
2. Continue a11y form labels.
