# 2026-09-30 — 0.294.0: Update preview accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Update preview exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.294.0
- Branch and base: `feat/gui-update-preview-label` on `main` (0.293.0)
- Implementation commit(s): d7b237f
- PR: #529

## Changes and relevant files

- Update preview sets `aria-label="Update preview"` and `aria-live="polite"`.
- Package 0.294.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #529; live-installed on 192.168.1.20 (0.294.0 / d7b237f90743f4ea06f984e89c4ae1448aa2f53e).
- Archive SHA-256: `7131ae829b23367a19294c9ac9f21be63c707cf5d23357d828285b89c72cdd39`
- Revision: `d7b237f90743f4ea06f984e89c4ae1448aa2f53e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.293.0 / revert of #529.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #529 and live-installed 0.294.0.
2. Label rollback preview next.
