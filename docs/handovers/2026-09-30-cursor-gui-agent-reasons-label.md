# 2026-09-30 — 0.202.0: Agent reasons accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Agent capability reasons in the picker must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.202.0
- Branch and base: `feat/gui-agent-reasons-label` on `main` (0.201.0)
- Implementation commit(s): f66c30b
- PR: #345

## Changes and relevant files

- `#agent-reasons` sets `aria-label="Agent capabilities"`.
- Package 0.202.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #345; live-installed on 192.168.1.20 (0.202.0 / f66c30b).
- Archive SHA-256: `68ef9d231d16fd92f0f4f57b49b70025063fa4232230ffa120404521169634a4`
- Revision: `f66c30b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.201.0 / revert of #345.

## Constraints and known issues

- Complements polite live announcements on the same element (0.138.0).

## Next steps

1. Done: merged #345 and live-installed 0.202.0.
2. Continue remaining a11y labeling polish.
