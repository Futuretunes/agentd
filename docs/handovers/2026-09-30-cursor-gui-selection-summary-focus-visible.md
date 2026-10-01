# 2026-09-30 — 0.502.0: Selection summary focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Selection summary focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.502.0
- Implementation commit(s): d381e23
- PR: #939

## Changes and relevant files

- See feature PR #939.
- Package 0.502.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #939; live-installed on 192.168.1.20 (0.502.0 / d381e23db0603e71d926906043df1ef64cb54740).
- Archive SHA-256: `070ed3ed92764f020e046894844b1e933f2f5a132d8c1da0d39931f086116e4a`
- Revision: `d381e23db0603e71d926906043df1ef64cb54740`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #939.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #939 and live-installed 0.502.0.
2. Continue a11y form labels.
