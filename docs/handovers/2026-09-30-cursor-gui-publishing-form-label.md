# 2026-09-30 — 0.167.0: Publish to GitHub form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publish to GitHub form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.167.0
- Branch and base: `feat/gui-publishing-form-label` on `main` (0.166.0)
- Implementation commit(s): f86a68b
- PR: #275

## Changes and relevant files

- `#publishing-form` aria-label "Publish to GitHub".
- Package 0.167.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #275; live-installed on 192.168.1.20 (0.167.0 / f86a68b).
- Archive SHA-256: `d4ca72f98b570112b5ce76b629908195f1b0a203daab95b377df80211c312c35`
- Revision: `f86a68b63d5bc10d1f0d031509b466faf046ff12`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.166.0 / revert of #275.

## Constraints and known issues

- Complements Publish primary review footer (0.91.0).

## Next steps

1. Done: merged #275 and live-installed 0.167.0.
2. Continue UX polish or admin slices as operator priority allows.
