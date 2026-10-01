# 2026-09-30 — 0.481.0: Project form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.481.0
- Implementation commit(s): 6613962
- PR: #898

## Changes and relevant files

- See feature PR #898.
- Package 0.481.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #898; live-installed on 192.168.1.20 (0.481.0 / 66139622fc6b1271c58a5b80407f006a96c55dc1).
- Archive SHA-256: `1c3e73feffdc0195c9cb28c2e2755cfbb791d44d394af24c2f78061776307944`
- Revision: `66139622fc6b1271c58a5b80407f006a96c55dc1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #898.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #898 and live-installed 0.481.0.
2. Continue a11y form labels.
