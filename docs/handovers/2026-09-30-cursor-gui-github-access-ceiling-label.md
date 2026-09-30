# 2026-09-30 — 0.242.0: GitHub access ceiling accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub access ceiling select exposes a stable id and accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.242.0
- Branch and base: `feat/gui-github-access-ceiling-label` on `main` (0.241.0)
- Implementation commit(s): 22a4d8c
- PR: #425

## Changes and relevant files

- GitHub access ceiling select sets `id="github-access-ceiling"` and keeps `aria-label="GitHub access ceiling"`.
- Package 0.242.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #425; live-installed on 192.168.1.20 (0.242.0 / 22a4d8cf6627350dabac15364038456e49b876b3).
- Archive SHA-256: `8cc1781304718a22f8935f54d8eeb26eeb0b62b737d5cc28cb7ac3e2c4bddb8e`
- Revision: `22a4d8cf6627350dabac15364038456e49b876b3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.241.0 / revert of #425.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #425 and live-installed 0.242.0.
2. Label saved-access-key confirmation checkbox next.
