# 2026-09-30 — 0.316.0: Configuration GitHub connection accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration GitHub connection section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.316.0
- Branch and base: `feat/gui-config-github-connection-label` on `main` (0.315.0)
- Implementation commit(s): 726f61c
- PR: #573

## Changes and relevant files

- Configuration GitHub connection section sets `aria-label="Configuration GitHub connection"`.
- Package 0.316.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #573; live-installed on 192.168.1.20 (0.316.0 / 726f61c1a48f99b0a0f851b71d5bc91471b2f24f).
- Archive SHA-256: `2decb94c1bdddd222fcdbb01cdb2619191dc620b8d1a1aca912e12b1859b8406`
- Revision: `726f61c1a48f99b0a0f851b71d5bc91471b2f24f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.315.0 / revert of #573.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #573 and live-installed 0.316.0.
2. Label Agent settings technical disclosure next.
