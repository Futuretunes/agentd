# 2026-09-30 — 0.449.0: Review progress dialog label (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review progress dialog label
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.449.0
- Implementation commit(s): 108245a
- PR: #836

## Changes and relevant files

- See feature PR #836.
- Package 0.449.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #836; live-installed on 192.168.1.20 (0.449.0 / 108245a50460687f6dfd07c855c575092629af9e).
- Archive SHA-256: `044095bbc4744b6eec208e818b78bb83f2ca88c8541e8b5d3e979c05b4637cce`
- Revision: `108245a50460687f6dfd07c855c575092629af9e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #836.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #836 and live-installed 0.449.0.
2. Continue a11y form labels.
