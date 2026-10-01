# 2026-09-30 — 0.414.0: Sidebar nav focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sidebar nav focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.414.0
- Implementation commit(s): 9665f2b
- PR: #768

## Changes and relevant files

- See feature PR #768.
- Package 0.414.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #768; live-installed on 192.168.1.20 (0.414.0 / 9665f2b48c97b9e722ff119b1e595d596cc511eb).
- Archive SHA-256: `4905e36aebef4d58129e4decf7107f74175c47a43c90fcd06cd8835b83312700`
- Revision: `9665f2b48c97b9e722ff119b1e595d596cc511eb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #768.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #768 and live-installed 0.414.0.
2. Continue a11y form labels.
