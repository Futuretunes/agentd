# 2026-09-30 — 0.101.0: Keep phone Send on the tools row (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: On phone, Send must not wrap to its own row under the composer tools
- Status: implemented
- Release: 0.101.0
- Branch and base: `feat/gui-composer-send-row` on `main` (0.100.0)
- Implementation commit(s): 42b33c8
- PR: (filled after open)

## Changes and relevant files

- Phone `.compose-foot` uses `flex-wrap: nowrap`; tools shrink; `#send` stays nowrap.
- Package 0.101.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Very narrow viewports may clip the picker summary (already ellipsized); Send remains visible.
- Actual-phone acceptance remains separate.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
