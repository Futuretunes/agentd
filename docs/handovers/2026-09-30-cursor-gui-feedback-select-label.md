# 2026-09-30 — 0.248.0: Feedback comment select accessible name lock (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback comment checkboxes keep Select + key accessible names
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.248.0
- Branch and base: `feat/gui-feedback-select-label` on `main` (0.247.0)
- Implementation commit(s): 0fc28ac
- PR: #437

## Changes and relevant files

- Package 0.248.0; source assertion in `test/ui.test.mjs` locks `aria-label="Select " + item.key`.

## Validation evidence

- CI green on #437; live-installed on 192.168.1.20 (0.248.0 / 0fc28ac14128e0d19382c020919c2a37d337c76f).
- Archive SHA-256: `e67e2c7cc63c310202283fd350fccee158a2a7054ae7c1a41747383a92fc1a58`
- Revision: `0fc28ac14128e0d19382c020919c2a37d337c76f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.247.0 / revert of #437.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #437 and live-installed 0.248.0.
2. Label sign-in guidance blurb next.
