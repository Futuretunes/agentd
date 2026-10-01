# 2026-09-30 — 0.330.0: Replace managed TLS certificate accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Replace managed TLS certificate form section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.330.0
- Branch and base: `feat/gui-tls-replace-section-label` on `main` (0.329.0)
- Implementation commit(s): d1154e8
- PR: #601

## Changes and relevant files

- Replace managed TLS certificate form section sets `aria-label="Replace managed TLS certificate"`.
- Package 0.330.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #601; live-installed on 192.168.1.20 (0.330.0 / d1154e8c60aef216538f5af471fd2e0a516e8537).
- Archive SHA-256: `cdfde1857a0af1fc381c9cc5c0efdc2ba4993f8449e81e8cf1444dfe5f0ced3d`
- Revision: `d1154e8c60aef216538f5af471fd2e0a516e8537`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.329.0 / revert of #601.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #601 and live-installed 0.330.0.
2. Label Managed runtime flags next.
