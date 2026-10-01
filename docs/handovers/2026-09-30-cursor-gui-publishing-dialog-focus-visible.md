# 2026-09-30 — 0.425.0: Publishing dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publishing dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.425.0
- Implementation commit(s): e014454
- PR: #790

## Changes and relevant files

- See feature PR #790.
- Package 0.425.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #790; live-installed on 192.168.1.20 (0.425.0 / e0144540d0cb4996a6f2b586d354a25dc42b2620).
- Archive SHA-256: `42b4a5c25094cf3166f452a67a9ff2e3fea739f9f944440d27f819a5243672a5`
- Revision: `e0144540d0cb4996a6f2b586d354a25dc42b2620`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #790.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #790 and live-installed 0.425.0.
2. Continue a11y form labels.
