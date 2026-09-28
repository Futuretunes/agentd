# 2026-09-28 — Candidate validation follow-up

- Author: Codex.
- Request: next backlog work; user clarified that the combined release was already installed.
- Status: implemented and tested; not installed.
- Draft PR: [#24](https://github.com/Futuretunes/agentd/pull/24).
- Staged source: `0473e2b18ec89c1b868e9dee47c96fd8c13cf75e`; archive SHA-256 `5c28859641e99561c88559654f8c5dfaf10c02a12999c9723bc4265f96d3353d`. Later handover commits do not change the staged archive.
- Installed: 0.21.1 at `be16009`, read-only health/manifest confirms task schema 1, starts 32, both services active.
- Candidate: 0.21.2; branch `fix/candidate-validation-boundaries`, based on `release/0.21.1` at `d042b77`.

## Changes

The duplicate local integration was aborted before commit/publication/deployment. Claude's complete release is the base. Reviewed the UI fixes and updater hardenings in `docs/reviews/2026-09-28-claude-combined-0.21.1-response.md`.

The installed validator accepted external node_modules root links and unexpected FIFOs in bounded local reproductions. `scripts/update.py` now rejects those, escaping/broken dependency links, hard links and other special files. Internal npm executable links are permitted. Source bytes and the release manifest are verified before privileged ownership changes and again before application swap. Existing configuration drift checks, same-filesystem check, stopped-state backup and rollback remain unchanged.

## Validation

Local: 13 Python deployment tests passed, TypeScript passed, five UI regressions passed. Exact installed function reproduced acceptance of an external dependency-root link and a FIFO; regressions now reject both. Final staged Linux suite: 107 passed, zero failures/skips. The stricter validator separately accepted the real prepared npm dependency tree (including internal bin links). No real provider requests or root installation.

## Deployment and constraints

No deployment. Current 0.21.1 stays healthy. This is an installer-only maintenance release; no database migration, UI overwrite, host policy relaxation or service-account change. The verified source archive and a thin administrator launcher are staged in the operator account; no production command was run. The launcher requires an existing managed baseline and does not use --adopt-existing. No first-adoption flag is needed for an established baseline. Rollback remains prior application plus matching state, never credential profiles/renewal journal. Power-loss recovery and backup retention retain existing limitations.

## Next

Claude: review link resolution, lstat/special-file checks, hard-link rejection, manifest comparison and validation placement before chown. This is reviewed-source integrity checking, not protection against arbitrary malicious release/test code or concurrent host compromise.

R5 web-gateway identity and restricted socket remain next. They were not implemented here: the required installer review exposed this prerequisite correction. R1 baseline consolidation, U1 decision and actual-phone acceptance remain open. Do not run the superseded standalone 0.20.1 installer.
