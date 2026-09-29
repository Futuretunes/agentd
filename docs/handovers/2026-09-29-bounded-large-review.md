# 2026-09-29 — Bounded per-file inspection for large reviews

- Author/agent: Codex
- Requested outcome: continue the backlog after installing the routing baseline.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.56.0, task schema 2.
- Branch and base: `feat/bounded-large-review` from `release/0.55.0-routing-baseline`.
- Implementation commit: `652b518c16a526c22304b003645f9098525700e0`.
- PR: https://github.com/Futuretunes/agentd/pull/61, draft against PR #60's branch pending final CI and review.

## Changes and relevant files

When an otherwise safe aggregate text diff exceeds the 180 KB response limit, the change-review dialog now lists its changed files and lets the signed-in browser inspect each file separately. `src/changes.ts` revalidates the exact revision/tree, literal changed path, sensitive filename/content policy, binary metadata and the same 180 KB response cap for every requested file. `src/runner.ts`, `src/gateway-protocol.ts` and `src/mobile.ts` bind reads to the owner, live preview job and exact tree. `public/app.js` renders returned patches through the existing inert file-review renderer.

This is an inspection-only first R14 slice. Truncated aggregate reviews still cannot be committed, used for revisions, or preserved by restart. Binary, sensitive, unscannable, individually oversized and non-member files remain blocked. No approval gate was weakened.

## Validation evidence

- Typecheck and formatting passed.
- Focused review/gateway/UI tests: 29/29 passed.
- macOS full suite: 187 passed, 0 failed; nine Linux-only tests skipped as expected.
- Required Ubuntu suite from the exact archive: 196/196 passed with zero failures and zero skips.
- Exact archive: version 0.56.0, task schema 2, SHA-256 `c7965b0beade33ff6943e86d252a05dd33df4fe42fcf5c6fcce7c8c8712abb47`.
- GitHub Actions is pending for the documentation-complete branch.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains the verified 0.55.0/task schema 2 baseline with starts 39. The cumulative 0.56.0 archive and managed launcher are staged privately but unexecuted. Schema remains 2; rollback still requires the matching managed application/task-state backup and separately preserved native profiles.

## Constraints and known issues

Opening a file proves that the server delivered a bounded exact-tree patch; it does not prove the human read it. Aggregate-large commit authorization remains deliberately unavailable. A single text-file diff above 180 KB still requires separate local review/reduction. Binary preview requires a separate design that never renders executable content or bypasses sensitive-data policy.

## Next steps

After CI and review, mark #61 ready. The next R14 slice is a durable exact-tree acknowledgement design for a complete set of individually bounded files, or bounded pagination within one oversized text file. Only then consider allowing checks/commit for a fully reviewed large snapshot. R8 GitHub consent narrowing, GUI administration, retention quotas and notifications remain queued.
