# 2026-09-30 — 0.522.0: High-contrast checkbox focus ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: High-contrast checkbox focus ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.522.0
- Implementation commit(s): a0c3790
- PR: #979

## Changes and relevant files

- See feature PR #979.
- Package 0.522.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #979; live-installed on 192.168.1.20 (0.522.0 / a0c37905d84b32661289894b32ba30f3a8cf22db).
- Archive SHA-256: `8a8f263a2826bb9eb4f35149fba90954e90ce311b5937632ceb351850a323cde`
- Revision: `a0c37905d84b32661289894b32ba30f3a8cf22db`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #979.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #979 and live-installed 0.522.0.
2. Continue a11y form labels.
