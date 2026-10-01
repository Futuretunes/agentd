# 2026-09-30 — 0.342.0: CLI install form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI install form exposes a stable accessible name from the package
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.342.0
- Branch and base: `feat/gui-cli-install-form-label` on `main` (0.341.0)
- Implementation commit(s): d2a82a3
- PR: #625

## Changes and relevant files

- CLI install form sets `aria-label` to `CLI install ` + package label.
- Package 0.342.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #625; live-installed on 192.168.1.20 (0.342.0 / d2a82a37ae46fd81931de9158174171389a6e9be).
- Archive SHA-256: `f87521873572b707b4c31e1b5e0e930a10d57637653110335e7951640c90cc18`
- Revision: `d2a82a37ae46fd81931de9158174171389a6e9be`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.341.0 / revert of #625.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #625 and live-installed 0.342.0.
2. Label Change access key form next.
