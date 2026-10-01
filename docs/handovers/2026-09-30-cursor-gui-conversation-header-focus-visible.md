# 2026-09-30 — 0.417.0: Conversation header focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation header focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.417.0
- Implementation commit(s): 361cd6b
- PR: #774

## Changes and relevant files

- See feature PR #774.
- Package 0.417.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #774; live-installed on 192.168.1.20 (0.417.0 / 361cd6b3daefd0a988f3cbc13ee296f058e5750d).
- Archive SHA-256: `57832af64a460854f1ab88289a843fe49f7b137e790067b0a54190db933fab58`
- Revision: `361cd6b3daefd0a988f3cbc13ee296f058e5750d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #774.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #774 and live-installed 0.417.0.
2. Continue a11y form labels.
