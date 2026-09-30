# 2026-09-30 — 0.250.0: Review diff line accessible name lock (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review diff lines keep Added/Removed accessible names
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.250.0
- Branch and base: `feat/gui-diff-line-label` on `main` (0.249.0)
- Implementation commit(s): f6370b3
- PR: #441

## Changes and relevant files

- Package 0.250.0; source assertion in `test/ui.test.mjs` locks `Added:` / `Removed:` accessible-name pattern for review diff lines.

## Validation evidence

- CI green on #441; live-installed on 192.168.1.20 (0.250.0 / e04d6860d382c7c5a36d6ce643356d0a7d718eed).
- Archive SHA-256: `886569f7c09da5746e21392604f525a2eae1267b595e353c784695251a5970c7`
- Revision: `e04d6860d382c7c5a36d6ce643356d0a7d718eed`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.249.0 / revert of #441.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #441 and live-installed 0.250.0.
2. Lock empty New conversation CTA accessible name next.
