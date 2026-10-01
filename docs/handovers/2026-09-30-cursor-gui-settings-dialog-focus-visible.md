# 2026-09-30 — 0.422.0: Settings dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.422.0
- Implementation commit(s): cee4128
- PR: #784

## Changes and relevant files

- See feature PR #784.
- Package 0.422.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #784; live-installed on 192.168.1.20 (0.422.0 / cee4128819cf9326c49fa4870d03dbc0d6d18d94).
- Archive SHA-256: `301c3898eecd253d39ef90ac65c1ab3a28ff1a03f23b639152962b113e94de82`
- Revision: `cee4128819cf9326c49fa4870d03dbc0d6d18d94`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #784.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #784 and live-installed 0.422.0.
2. Continue a11y form labels.
