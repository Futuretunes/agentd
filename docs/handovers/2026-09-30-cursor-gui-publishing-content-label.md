# 2026-09-30 — 0.182.0: Publication preview accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication preview live region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.182.0
- Branch and base: `feat/gui-publishing-content-label` on `main` (0.181.0)
- Implementation commit(s): 32f54d7
- PR: #305

## Changes and relevant files

- `#publishing-content` aria-label "Publication preview" (keeps aria-live polite).
- Package 0.182.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #305; live-installed on 192.168.1.20 (0.182.0 / 32f54d7).
- Archive SHA-256: `d703c04fb9daa9e1d66cee03569e55fe9a933d043212f13e8c960cb3e32a8723`
- Revision: `32f54d7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.181.0 / revert of #305.

## Constraints and known issues

- Complements Publish to GitHub form label.

## Next steps

1. Done: merged #305 and live-installed 0.182.0.
2. Continue UX polish or admin slices as operator priority allows.
