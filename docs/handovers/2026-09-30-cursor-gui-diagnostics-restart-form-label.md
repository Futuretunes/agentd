# 2026-09-30 — 0.336.0: Diagnostics service restart form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics service restart form exposes a stable accessible name from the service name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.336.0
- Branch and base: `feat/gui-diagnostics-restart-form-label` on `main` (0.335.0)
- Implementation commit(s): 76b7926
- PR: #613

## Changes and relevant files

- Diagnostics service restart form sets `aria-label="Restart " + label`.
- Package 0.336.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #613; live-installed on 192.168.1.20 (0.336.0 / 76b7926d8b94be7eb948749ca01f469d8fec5f7c).
- Archive SHA-256: `b0618b78928a4cef370ded4b5bcf7fe4ceb2cd7c6d6dca5126a0442c670fa6b8`
- Revision: `76b7926d8b94be7eb948749ca01f469d8fec5f7c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.335.0 / revert of #613.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #613 and live-installed 0.336.0.
2. Label Configuration service restart form next.
