# 2026-09-28 — Shared sensitive-data checks

- Author: Codex; authorized overnight R13 and related R14 binary correction.
- Release: cumulative 0.26.0, task schema 1. Includes R6/R7/R12.
- Branch: `feat/sensitive-data-review` from `feat/shared-git-policy` at `4478bac`.
- Status: implemented; exact Linux/CI verified. Not installed.

## Changes

Shared `src/sensitive-data.ts` replaces divergent filename expressions and supplies bounded content scanning, metadata binary detection and non-secret findings. `changes.ts` scans both exact blob versions and withholds blocked patches. `publishing.ts` scans every outgoing revision plus commit messages and PR metadata; removed-in-later-commit credentials still block publication. Existing commit/revision approval guards consume the same review findings. Git literal pathspecs and blob IDs prevent path-option confusion. No credential matcher returns matched values.

See `docs/sensitive-data.md` for limits, false positives and explicit non-guarantees. This does not scrub existing history/logs/prompts or guarantee secret discovery/erasure; snapshot objects may already exist locally. R14 larger-diff/binary GUI support remains open.

## Validation

New tests exercise expanded filenames, known signatures, placeholder handling, scan bounds, safe patch withholding, deletion-side scanning, ordinary text containing the old binary phrase, actual binary data and outgoing history with a later credential removal. Final exact archive `3af7da7` passed typecheck and 125/125 Linux tests with zero skips/failures; CI `36478623425` passed. Archive SHA256 `c2cd9ce2dc7f1262df77407ffec2c1573632a75d5462424f0d578acfb7169d6f`. [Draft #29](https://github.com/Futuretunes/agentd/pull/29) targets shared Git policy. No live model request, account consent, production update or publication.

## Deployment/rollback and next

Use the eventual cumulative managed archive and explicit resource profile migration. No new schema/config transition for this item. Installed release remains 0.22.0. Continue R15 bounded oversized review handling and stage one operator launcher. Leave reviewed baseline/merge decisions and GitHub App consent with the operator.
