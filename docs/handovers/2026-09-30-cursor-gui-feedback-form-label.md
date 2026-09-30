# 2026-09-30 — 0.171.0: GitHub feedback form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub feedback controls must expose a stable accessible form name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.171.0
- Branch and base: `feat/gui-feedback-form-label` on `main` (0.170.0)
- Implementation commit(s): 9024973
- PR: #283

## Changes and relevant files

- `#feedback-form` wraps feedback controls with aria-label "GitHub feedback".
- Load/integrate buttons are `type="button"`; form submit is prevented.
- Package 0.171.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #283; live-installed on 192.168.1.20 (0.171.0 / 9024973).
- Archive SHA-256: `3689fa1b78372878d20adb50dbdf04311e9d70c31f3b0d44f456b3f0d4733208`
- Revision: `3dfc3743cb3588935d6d38e43b51bac81fd1526f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.170.0 / revert of #283.

## Constraints and known issues

- Feedback results panel remains a separate live region below the form.

## Next steps

1. Done: merged #283 and live-installed 0.171.0.
2. Continue UX polish or admin slices as operator priority allows.
