# 2026-09-30 — 0.134.0: Empty project list New project CTA (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Empty project lists offer a clear start action matching empty conversations
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.134.0
- Branch and base: `feat/gui-empty-project-cta` on `main` (0.133.0)
- Implementation commit(s): c1d72c3
- PR: #209

## Changes and relevant files

- `emptyProjectList` builds copy + “＋ New project” wired to `#add-project`.
- Package 0.134.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #209; live-installed on 192.168.1.20 (0.134.0 / c1d72c3).
- Archive SHA-256: `0a70d9a80ff65c5051bdf83b6ae13d4bee8212791346512fbec23d44ee4746ee`
- Revision: `c1d72c3b2c12909d79997f9669971eb4269636e0`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.133.0 / revert of #209.

## Constraints and known issues

- Empty CTA reuses the Create or import project control handler.

## Next steps

1. Done: merged #209 and live-installed 0.134.0.
2. Continue UX polish or admin slices as operator priority allows.
