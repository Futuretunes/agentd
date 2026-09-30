# 2026-09-30 — 0.243.0: Saved access key confirmation accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Saved-access-key confirmation checkbox exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.243.0
- Branch and base: `feat/gui-saved-access-key-label` on `main` (0.242.0)
- Implementation commit(s): 20ed56e
- PR: #427

## Changes and relevant files

- Access-key change confirmation checkbox sets `aria-label="I saved the new access key securely"`.
- Package 0.243.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #427; live-installed on 192.168.1.20 (0.243.0 / 20ed56e223efc72a45e92b1f680362b1aac24eef).
- Archive SHA-256: `ad4b5408b894132a47198f41abac5caf0091de288c5aa5d57b06ff9e51ca5f4c`
- Revision: `20ed56e223efc72a45e92b1f680362b1aac24eef`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.242.0 / revert of #427.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #427 and live-installed 0.243.0.
2. Label active project eyebrow next.
