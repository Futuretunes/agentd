# 2026-09-28 — Reviewable formatting

- Author: Codex; R2 mechanical-formatting portion.
- Branch: `chore/reviewable-formatting`, based on durable creation requests.
- Cumulative candidate remains 0.32.0, task schema 2; production 0.22.0 unchanged.

## Changes

Pinned Prettier 3.9.9, explicit TypeScript/JavaScript source, browser, test and script scope, format/write and format/check commands, CI enforcement, and contributor guidance. Formatter options are in the release-included package metadata. Broad formatting is a separate mechanical commit with no intended behavior change. Python, Markdown and deployment files are outside its scope. Typechecking remains the static-analysis gate; no new semantic lint claims.

## Validation

Formatting check and typecheck passed. Exact archive `9d4374c2930702497ef82976798da672b5c6358c` passed all 136 Linux tests with zero skips, typecheck and formatting check. SHA-256: `b229f23123ee14f11cfed3f731263a5df9e735706e1853d1b1e0bea725b6030f`. Local macOS tests passed 128 with 8 Linux-only skips. Draft #36; CI run 36484009612 passed. No model requests, login/consent, installation or cleanup. A second formatter pass was necessary for one runner expression; the final check is stable.

## Next

R2 is partial: separate semantic lint policy, runner decomposition and an explicit operation compatibility table remain open. R10 asynchronous preparation remains next. Preserve the cumulative resource, sandbox and approval boundaries. Stage one combined managed update after validation, with matching schema-2 rollback state. See previous handovers for substantive safeguards.
