# 2026-09-30 — 0.313.0: Runtime flags accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration Runtime flags section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.313.0
- Branch and base: `feat/gui-config-runtime-flags-label` on `main` (0.312.0)
- Implementation commit(s): fb72504
- PR: #567

## Changes and relevant files

- Configuration Runtime flags section sets `aria-label="Runtime flags"`.
- Package 0.313.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #567; live-installed on 192.168.1.20 (0.313.0 / fb725049189f694dfb5c868b92e54bde29163ae3).
- Archive SHA-256: `b976bba83b003764a25aeb652b285a922406b1834e7e4a6c696fb15796dc242a`
- Revision: `fb725049189f694dfb5c868b92e54bde29163ae3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.312.0 / revert of #567.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #567 and live-installed 0.313.0.
2. Label Signed-in origin next.
