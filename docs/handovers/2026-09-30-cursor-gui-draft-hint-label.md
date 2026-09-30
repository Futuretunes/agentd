# 2026-09-30 — 0.198.0: Draft hint accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Composer draft hint must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.198.0
- Branch and base: `feat/gui-draft-hint-label` on `main` (0.197.0)
- Implementation commit(s): 05e532b
- PR: #337

## Changes and relevant files

- `#draft-hint` sets `aria-label="Saved draft"`.
- Package 0.198.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #337; live-installed on 192.168.1.20 (0.198.0 / 05e532b).
- Archive SHA-256: `a294feedec2e30d323a2719bc14660eb1c4735d886d104202b8a3c466b99d02f`
- Revision: `05e532b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.197.0 / revert of #337.

## Constraints and known issues

- Complements existing polite live region on composer hints (0.109.0).

## Next steps

1. Done: merged #337 and live-installed 0.198.0.
2. Continue labeling policy and composer hint regions.
