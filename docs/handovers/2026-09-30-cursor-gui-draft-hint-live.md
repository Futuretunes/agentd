# 2026-09-30 — 0.109.0: Live composer hints (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Draft, policy and status hints announce to assistive tech when they change
- Status: implemented
- Release: 0.109.0
- Branch and base: `feat/gui-draft-hint-live` on `main` (0.108.0)
- Implementation commit(s): 98c6ed3
- PR: #159

## Changes and relevant files

- `#draft-hint`, `#policy-hint` and `#hint` set `aria-live="polite"`.
- Connection status span also polite-live for reconnect messaging if updated later.
- Package 0.109.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Polite live regions do not interrupt; assertive was avoided for routine draft/policy copy.
- Attribute order may place `aria-live` before/after other attributes; tests allow either.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
