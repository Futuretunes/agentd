# 2026-09-30 — 0.114.0: Send/Stop accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer Send and Stop/Cancel expose names that do not depend on ↑ / ■ glyphs
- Status: implemented
- Release: 0.114.0
- Branch and base: `feat/gui-send-stop-labels` on `main` (0.113.0)
- Implementation commit(s): 925990f
- PR: (filled after open)

## Changes and relevant files

- `#send` has `aria-label="Send message"`.
- `composerStopControl` adds `accessibleName`; `#stop-current` applies it on refresh.
- Package 0.114.0; unit/HTML coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Visible labels still use ■ / ↑ for sighted density; AT uses aria-label.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
