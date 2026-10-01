# 2026-09-30 — 0.462.0: Settings accounts focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings accounts focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.462.0
- Implementation commit(s): 3a20b91
- PR: #862

## Changes and relevant files

- See feature PR #862.
- Package 0.462.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #862; live-installed on 192.168.1.20 (0.462.0 / 3a20b91861ea42e9a43fabee7a7414943cc4f86d).
- Archive SHA-256: `74989bcaa757a6c86dab014b229ee55fdc227d01fd99e2119e8334d7634e7335`
- Revision: `3a20b91861ea42e9a43fabee7a7414943cc4f86d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #862.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #862 and live-installed 0.462.0.
2. Continue a11y form labels.
