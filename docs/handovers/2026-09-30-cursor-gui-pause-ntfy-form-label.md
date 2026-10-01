# 2026-09-30 — 0.341.0: Pause/Resume ntfy notifications form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Pause/Resume ntfy notifications form exposes a stable accessible name from the action
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.341.0
- Branch and base: `feat/gui-pause-ntfy-form-label` on `main` (0.340.0)
- Implementation commit(s): 0527a2f
- PR: #623

## Changes and relevant files

- Pause/Resume ntfy notifications form sets `aria-label` to Pause or Resume ntfy notifications.
- Package 0.341.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #623; live-installed on 192.168.1.20 (0.341.0 / 0527a2f6aacc86a73c1436fab34452002cf0bfa9).
- Archive SHA-256: `4a3f9703488387230b88f644d5e8e300bb6d71e2a7f4fd2526a89a4ea757076e`
- Revision: `0527a2f6aacc86a73c1436fab34452002cf0bfa9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.340.0 / revert of #623.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #623 and live-installed 0.341.0.
2. Label CLI install form next.
