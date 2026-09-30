# 2026-09-30 — 0.239.0: Live run output polite announcement (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Live run output keeps a stable accessible name and announces politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.239.0
- Branch and base: `feat/gui-live-output-live` on `main` (0.238.0)
- Implementation commit(s): b47e72c
- PR: #419

## Changes and relevant files

- Live `<pre class="result live-output">` keeps `aria-label="Current run output"` and sets `aria-live="polite"`.
- Package 0.239.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #419; live-installed on 192.168.1.20 (0.239.0 / b47e72c619fd69427914298eb19fc249ff30390b).
- Archive SHA-256: `45fb6dde29b5f94ed21dbdaac1a0e51e4c1be2bf40cec063299b4ce2eadbace1`
- Revision: `b47e72c619fd69427914298eb19fc249ff30390b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.238.0 / revert of #419.

## Constraints and known issues

None beyond ordinary accessible naming and polite live regions.

## Next steps

1. Done: merged #419 and live-installed 0.239.0.
2. Label current access key confirmation field next.
