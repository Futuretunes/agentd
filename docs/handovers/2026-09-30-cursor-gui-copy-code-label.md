# 2026-09-30 — 0.245.0: Answer Copy code accessible name lock (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Answer Copy code control keeps its accessible name and polite announcement
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.245.0
- Branch and base: `feat/gui-copy-code-label` on `main` (0.244.0)
- Implementation commit(s): bc3ad54
- PR: #431

## Changes and relevant files

- Package 0.245.0; source assertion in `test/ui.test.mjs` locks `aria-label="Copy code"` and `aria-live="polite"`.

## Validation evidence

- CI green on #431; live-installed on 192.168.1.20 (0.245.0 / bc3ad545d2dd84f94e82153075c7362eda11ae1d).
- Archive SHA-256: `d6ce613717c6112a6b8b7ae39f53b62248ffeb9c7ac1f5816c0367bbe790c6df`
- Revision: `bc3ad545d2dd84f94e82153075c7362eda11ae1d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.244.0 / revert of #431.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #431 and live-installed 0.245.0.
2. Lock remaining-allowance accessible name next.
