# 2026-09-30 — 0.340.0: Clear ntfy destination form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Clear ntfy destination form exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.340.0
- Branch and base: `feat/gui-clear-ntfy-form-label` on `main` (0.339.0)
- Implementation commit(s): b2f0962
- PR: #621

## Changes and relevant files

- Clear ntfy destination form sets `aria-label="Clear ntfy destination"`.
- Package 0.340.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #621; live-installed on 192.168.1.20 (0.340.0 / b2f0962a9898b5b51b942c4f676619097561c396).
- Archive SHA-256: `c36207cc33df7090a9a2cde8a9f525a5f6b0681f718b3dba4bbbf3b71cdeabd8`
- Revision: `b2f0962a9898b5b51b942c4f676619097561c396`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.339.0 / revert of #621.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #621 and live-installed 0.340.0.
2. Label Pause/Resume ntfy notifications form next.
