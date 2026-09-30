# 2026-09-30 — 0.100.0: Disabled option reasons (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Disabled agent/mode `<option>`s must expose a reason on hover/title
- Status: implemented
- Release: 0.100.0
- Branch and base: `feat/gui-disabled-option-reasons` on `main` (0.99.0)
- Implementation commit(s): 246c0f6
- PR: (filled after open)

## Changes and relevant files

- `disabledOptionReason` in `public/ui.js`.
- Composer adapter/mode options set `title` when disabled (policy/install or mode not offered).
- Package 0.100.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Native `<option>` title support varies by browser; the shared agent-reasons line remains the always-visible explanation.
- Colour-only status cues and contrast audits remain later U19 items.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
