# 2026-09-30 — 0.335.0: Enable profile section accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Enable profile form section exposes a stable accessible name from the profile name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.335.0
- Branch and base: `feat/gui-profile-enable-section-label` on `main` (0.334.0)
- Implementation commit(s): 3503cd8
- PR: #611

## Changes and relevant files

- Enable profile form section sets `aria-label="Enable " + label`.
- Package 0.335.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #611; live-installed on 192.168.1.20 (0.335.0 / 3503cd881283e45a56bcc30b828ab62880055130).
- Archive SHA-256: `14a5e8e1a955154332cac32f6e1b144201d8f6003e1110380f2f3af71e433c32`
- Revision: `3503cd881283e45a56bcc30b828ab62880055130`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.334.0 / revert of #611.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #611 and live-installed 0.335.0.
2. Label Diagnostics service restart form next.
