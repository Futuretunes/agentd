# 2026-09-30 — 0.282.0: Confirm publication dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Confirm publication dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.282.0
- Branch and base: `feat/gui-publication-confirm-head-label` on `main` (0.281.0)
- Implementation commit(s): 8e0a0f8
- PR: #505

## Changes and relevant files

- Confirm publication form wraps the heading in `#publication-confirm-heading-group` with `role="group"` and `aria-label="Confirm publication heading"`.
- Package 0.282.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #505; live-installed on 192.168.1.20 (0.282.0 / 8e0a0f82a720734a534e2ca85a97ee58a5bcbf73).
- Archive SHA-256: `52f18f01b9e1accc7ed8fa5922c5f111bd7b01ad5ecdc712a3b9eefa75337984`
- Revision: `8e0a0f82a720734a534e2ca85a97ee58a5bcbf73`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.281.0 / revert of #505.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #505 and live-installed 0.282.0.
2. Label Create project actions group next.
