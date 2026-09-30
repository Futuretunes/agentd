# 2026-09-30 — 0.225.0: Feedback target accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback target select exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.225.0
- Branch and base: `feat/gui-publishing-base-label` on `main` (0.224.0)
- Implementation commit(s): 307eeff
- PR: #391

## Changes and relevant files

- `#feedback-target` keeps visible Published pull request label and matching `aria-label`.
- Package 0.225.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #391; live-installed on 192.168.1.20 (0.225.0 / 307eeff693a68977d5f60691de97a073aa7b648a).
- Archive SHA-256: `333159e6e6195a10aed7fb94705db1e378e395630f5afefc6eaf8dc4e8ce2bd6`
- Revision: `307eeff693a68977d5f60691de97a073aa7b648a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.224.0 / revert of #391.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #391 and live-installed 0.225.0.
2. Continue form control accessible-name polish.
