# 2026-09-30 — 0.140.0: Mode/Agent described by capability reasons (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Mode and Agent selects must expose capability reasons with the controls
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.140.0
- Branch and base: `feat/gui-agent-reasons-describedby` on `main` (0.139.0)
- Implementation commit(s): 349f898
- PR: #220

## Changes and relevant files

- `#mode` and `#adapter` set `aria-describedby="agent-reasons"`.
- Package 0.140.0; HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #220; live-installed on 192.168.1.20 (0.140.0 / 349f898).
- Archive SHA-256: `c2eb04844ef61586258c44bae0017ecf3c94e7a85ecf85d464bb0e2e96f4cff1`
- Revision: `349f89895eeacb2194ae444edbabbae5ce834909`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.139.0 / revert of #220.

## Constraints and known issues

- Complements 0.138.0 polite live region on the same reason line.

## Next steps

1. Done: merged #220 and live-installed 0.140.0.
2. Continue UX polish or admin slices as operator priority allows.
