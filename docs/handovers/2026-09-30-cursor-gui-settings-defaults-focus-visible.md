# 2026-09-30 — 0.488.0: Settings defaults focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings defaults focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.488.0
- Implementation commit(s): dcea99b
- PR: #911

## Changes and relevant files

- See feature PR #911.
- Package 0.488.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #911; live-installed on 192.168.1.20 (0.488.0 / dcea99b7761737b794642d34798d6cbc1126448e).
- Archive SHA-256: `d7295b967e6e320f95ec437f8522a03462a58913428be28e3f16443999b18d35`
- Revision: `dcea99b7761737b794642d34798d6cbc1126448e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #911.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #911 and live-installed 0.488.0.
2. Continue a11y form labels.
