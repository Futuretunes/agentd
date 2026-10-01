# 2026-09-30 — 0.418.0: Turn actions focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Turn actions focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.418.0
- Implementation commit(s): b259a82
- PR: #776

## Changes and relevant files

- See feature PR #776.
- Package 0.418.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #776; live-installed on 192.168.1.20 (0.418.0 / b259a82550e33fe49ff97d69df88fbe8e78d7142).
- Archive SHA-256: `97110d37b82be4348468a17b897afc7312aab04a76343546823a5d78b35f53ae`
- Revision: `b259a82550e33fe49ff97d69df88fbe8e78d7142`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #776.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #776 and live-installed 0.418.0.
2. Continue a11y form labels.
