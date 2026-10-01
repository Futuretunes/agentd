# 2026-09-30 — 0.308.0: Paginated review accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Paginated review panel and controls expose stable accessible names
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.308.0
- Branch and base: `feat/gui-paginated-review-controls-label` on `main` (0.307.0)
- Implementation commit(s): 229ef4a
- PR: #557

## Changes and relevant files

- Paginated review panel sets `aria-label="Paginated review"`; controls set `role="group"` and `aria-label="Paginated review controls"`.
- Package 0.308.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #557; live-installed on 192.168.1.20 (0.308.0 / 229ef4a62bca7d90dfd43748048c86a6ef6d4da5).
- Archive SHA-256: `68f54b3caeec4c1983fdeb97165b66ba094b5ccf5509de4ed309ee17fea697b7`
- Revision: `229ef4a62bca7d90dfd43748048c86a6ef6d4da5`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.307.0 / revert of #557.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #557 and live-installed 0.308.0.
2. Label Configuration managed status next.
