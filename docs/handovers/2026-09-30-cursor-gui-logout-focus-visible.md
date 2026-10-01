# 2026-09-30 — 0.543.0: Sign-out focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-out focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.543.0
- Implementation commit(s): bd7327f
- PR: #1020

## Changes and relevant files

- See feature PR #1020.
- Package 0.543.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1020; live-installed on 192.168.1.20 (0.543.0 / bd7327f86886cd6613ab44e2fb6ce205df6357cc).
- Archive SHA-256: `1d33f3c2868a3ccb3a3b7307842f267bb0f7db3991b9b55681cbe5c51fb2fd2b`
- Revision: `bd7327f86886cd6613ab44e2fb6ce205df6357cc`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1020.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1020 and live-installed 0.543.0.
2. Continue a11y form labels.
