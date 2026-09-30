# 2026-09-30 — 0.116.0: Keyboard Attach control (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer attach control must be a real keyboard-focusable button, not a label wrapping a visually hidden file input
- Status: implemented
- Release: 0.116.0
- Branch and base: `feat/gui-attach-button` on `main` (0.115.0)
- Implementation commit(s): 25d2a08
- PR: #173

## Changes and relevant files

- `#attach` is a `<button aria-label="Attach images">` that activates `#files`.
- `#files` is `sr-only` with `tabindex="-1"` so Tab lands on the button.
- Chat/text-only modes disable and hide the button; `setupShell` no longer opens Settings via raw `showModal`.
- Package 0.116.0; HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- The file input remains in the DOM for the picker; assistive tech uses the button name.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
