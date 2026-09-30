# 2026-09-30 — 0.231.0: Repository URL accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Repository URL input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.231.0
- Branch and base: `feat/gui-repository-url-label` on `main` (0.230.0)
- Implementation commit(s): 6c4bd85
- PR: #403

## Changes and relevant files

- `#repository-url` keeps visible Repository URL label and matching `aria-label`.
- Package 0.231.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #403; live-installed on 192.168.1.20 (0.231.0 / 6c4bd85e1d6f5feabdc80af2a3b5a9b8ce41dc07).
- Archive SHA-256: `489ceb6ee593ed82ba26ea639342bb8009bc341ae4de72e8b38eee2b2daff8b9`
- Revision: `6c4bd85e1d6f5feabdc80af2a3b5a9b8ce41dc07`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.230.0 / revert of #403.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #403 and live-installed 0.231.0.
2. Label repository import project name next.
