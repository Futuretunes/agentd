# 2026-09-30 — 0.122.0: Suggestion chip accessible names (UX-1 / U19)

- Author/agent: Cursor
- Requested outcome: Welcome suggestion chips must expose clear accessible names as a labeled group
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.122.0
- Branch and base: `feat/gui-suggestion-labels` on `main` (0.121.0)
- Implementation commit(s): 9b42179
- PR: #185

## Changes and relevant files

- Welcome `.suggestions` is `role="group"` with `aria-label="Suggested prompts"`.
- Each chip sets `aria-label="Use suggestion: …"`.
- Package 0.122.0; source assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #185; live-installed on 192.168.1.20 (0.122.0 / 1879d43).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.121.0 / revert of #185.

## Constraints and known issues

- Visible chip text stays unchanged for sighted density.

## Next steps

1. Done: merged #185 and live-installed 0.122.0.
2. Continue UX polish or admin slices as operator priority allows.
