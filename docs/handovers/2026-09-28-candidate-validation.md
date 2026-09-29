# 2026-09-28 — Candidate validation follow-up

- Author: Codex.
- Request: next backlog work; user clarified that the combined release was already installed.
- Status: implemented, tested and installed; service health independently verified.
- Draft PR: [#24](https://github.com/Futuretunes/agentd/pull/24).
- Installed source: `add2d08f23cfea40814514219e0da57567eac004`; archive SHA-256 `eed770e0f56c4086c5d480c93c558cb18c0c9f33c3eaead809faa42c96cf5be8`. Later handover commits do not change the staged archive.
- Installed: 0.21.2 at `add2d08`, read-only health/manifest confirms task schema 1, starts 33, both services active.
- Release: 0.21.2; branch `fix/candidate-validation-boundaries`, based on `release/0.21.1` at `d042b77`.

## Installation acceptance

Operator output confirms all 107 deployment tests passed with zero skips and the application update completed with a private rollback backup. Independent read-only health and manifest verification confirms version 0.21.2, source `add2d08`, metadata/task schema 1, serial dispatch enabled, starts 33 and both services active. The installer reports units, configuration, project checkouts and native profiles preserved. Backup location remains in the operator's local output; no private deployment paths are added here. No model request or new end-to-end GUI acceptance run was submitted. The failed-attempt notes below are historical.

## Follow-up — validation caller regression

The operator's installer ran all 107 tests, then refused `tsconfig.json` before service shutdown or swap. Reproduced through `test_candidate`: an `os.walk` loop shadowed the `files` argument, replacing the manifest mapping with a directory listing before `verify_candidate`. Renamed the manifest argument and walk variables. Added a full validation-flow fixture (systemd/chown mocked, real filesystem and verifier): valid manifest files survive all three test commands, tampering fails before root ownership changes. This regression failed with the exact reported error before the fix. Earlier standalone verifier tests missed this calling-path defect. No unit/policy change or rejection bypass. Corrected source `add2d08` passed 14 Python deployment fixtures, all 107 Linux tests with zero skips/failures, and GitHub Node 24/26 plus required Linux isolation. The same staged launcher now references the corrected archive. Read-only production health still reports 0.21.1, starts 32; the failed attempt did not reach service shutdown or create a pending transaction, so no rollback/journal cleanup is needed.

## Changes

The duplicate local integration was aborted before commit/publication/deployment. Claude's complete release is the base. Reviewed the UI fixes and updater hardenings in `docs/reviews/2026-09-28-claude-combined-0.21.1-response.md`.

The installed validator accepted external node_modules root links and unexpected FIFOs in bounded local reproductions. `scripts/update.py` now rejects those, escaping/broken dependency links, hard links and other special files. Internal npm executable links are permitted. Source bytes and the release manifest are verified before privileged ownership changes and again before application swap. Existing configuration drift checks, same-filesystem check, stopped-state backup and rollback remain unchanged.

## Validation

Local: 14 Python deployment tests passed, TypeScript passed, five UI regressions passed. Exact installed function reproduced acceptance of an external dependency-root link and a FIFO; regressions now reject both. Final staged Linux suite: 107 passed, zero failures/skips. The stricter validator separately accepted the real prepared npm dependency tree (including internal bin links). No real provider requests or root installation.

## Deployment and constraints

Successfully deployed by the operator. Current 0.21.2 is healthy. This is an installer-only maintenance release; no database migration, UI overwrite, host policy relaxation or service-account change. The verified source archive and a thin administrator launcher are staged in the operator account; the operator ran the launcher successfully. The launcher requires an existing managed baseline and does not use --adopt-existing. No first-adoption flag is needed for an established baseline. Rollback remains prior application plus matching state, never credential profiles/renewal journal. Power-loss recovery and backup retention retain existing limitations.

## Next

Claude: review link resolution, lstat/special-file checks, hard-link rejection, manifest comparison and validation placement before chown. This is reviewed-source integrity checking, not protection against arbitrary malicious release/test code or concurrent host compromise.

R5 web-gateway identity and restricted socket remain next. They were not implemented here: the required installer review exposed this prerequisite correction. R1 baseline consolidation, U1 decision and actual-phone acceptance remain open. Do not run the superseded standalone 0.20.1 installer.
