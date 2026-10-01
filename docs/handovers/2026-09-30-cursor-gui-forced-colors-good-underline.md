# 2026-09-30 — 0.587.0: Forced-colors good underline (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Forced-colors good underline
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.587.0
- Implementation commit(s): 6a52cb9
- PR: #1108

## Changes and relevant files

- See feature PR #1108.
- Package 0.587.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1108; live-installed on 192.168.1.20 (0.587.0 / 6a52cb938fbc52c37c5901feb390aad9f0bfce3b).
- Archive SHA-256: `261932a01f820ef541dcc257a47db0f3a355829375333c0bdc2bf992d9fd7cad`
- Revision: `6a52cb938fbc52c37c5901feb390aad9f0bfce3b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1108.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1108 and live-installed 0.587.0.
2. Continue a11y form labels.
