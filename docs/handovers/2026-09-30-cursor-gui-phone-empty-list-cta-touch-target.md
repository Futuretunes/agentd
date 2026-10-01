# 2026-09-30 — 0.575.0: Phone empty-list CTA touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone empty-list CTA touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.575.0
- Implementation commit(s): 34abfd0
- PR: #1084

## Changes and relevant files

- See feature PR #1084.
- Package 0.575.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1084; live-installed on 192.168.1.20 (0.575.0 / 34abfd01251d1b7a8917188c53a2edcea50c914b).
- Archive SHA-256: `583450c506f93a47f539370b0243fb6c29781d938111daf418fbf7bac1739696`
- Revision: `34abfd01251d1b7a8917188c53a2edcea50c914b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1084.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1084 and live-installed 0.575.0.
2. Continue a11y form labels.
