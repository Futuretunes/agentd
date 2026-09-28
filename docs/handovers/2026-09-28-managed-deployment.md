# 2026-09-28 — Managed deployment and transactional task schema

- Author: Codex.
- Request: continue with the next work item after UI redesign/exact-tree checks.
- Status: implemented and tested; not installed.
- Candidate: 0.21.0. Installed 0.20.0 confirmed by read-only health and active runner/mobile services on 2026-09-28.
- PR: [#23](https://github.com/Futuretunes/agentd/pull/23), draft. Implementation commits `d47df63`, `b2bc2e9`, `a58f364`, `af7ca04`, `8b7c4a2`.
- Staged release revision: `8b7c4a2d725ae74024cf55231a96ecfa50ab44a8`; archive SHA-256 `b65a2c00483030334ceae0ce9066ae4f0461e1085e52b7932b579fd38ddc1199`. Subsequent handover-only changes do not change this candidate.
- Branch: `feat/reproducible-deployment`, based on `feat/task-desk-redesign` at `58d4276` (PR #22). No main merge or PR-stack closure.

## Follow-up — gateway compatibility correction

The first administrator attempt refused `LockPersonality` before application/database changes. Read-only inspection confirms 0.20.0 remains healthy. Root cause: the updater applied the runner's personality-lock requirement to the gateway, although `deploy/agentd-mobile.service` never sets it. The corrected check still requires `yes` for the runner, accepts the gateway's existing `yes`/`no` value, and fingerprints that value so later drift is rejected. No unit or host protection is changed. Regression fixtures now match the shipped gateway template, verify both gateway values are recorded differently, refuse a disabled runner lock, and still reject disabled common protections. The corrected source archive and same operator launcher are staged. Seven Python deployment fixtures passed; the staged Linux suite passed 105/105 with zero skips/failures. GitHub Node 24/26 and required isolation jobs passed at `af7ca04`. The administrator can rerun the same launcher. No rollback or pending-journal cleanup is needed for this early preflight refusal.

## Follow-up — omitted mobile defaults

A second preflight refusal exposed another updater/runtime mismatch: mobile startup supplies fixed socket/public-directory defaults when JSON omits those keys, but the updater required explicit values. Inventory now uses the same defaults for absent keys; explicit null, empty or mismatching values remain rejected with field-specific errors. Fixtures cover fully/partly omitted defaults and all invalid overrides. Corrected candidate `8b7c4a2` passed all 105 Linux tests with zero skips/failures, all seven Python deployment fixtures, and GitHub Node 24/26 plus Required Linux isolation. The existing launcher now references its verified archive; rerun the same administrator command. Read-only health still shows 0.20.0, starts 30. Neither mobile configuration nor service policy is changed. The refusal is before service stop, backup or migration; installation remains pending.

## Changes

R9: `src/task-database.ts` extracts schema/startup recovery from the runner, migrates unversioned historical data in one transaction, records user_version 1 and refuses future versions before task recovery/worker cleanup. Schema validation and failed legacy ancestry/recovery roll back all migration effects. Health reports taskSchemaVersion separately from metadata schemaVersion. The old defect-demonstration R9 block is retired in favor of acceptance regressions.

The final read-only systemd check exposed transient PID/start-time fields in ExecStart; these are now excluded from configuration fingerprints, with a restart-stability regression. Configured commands remain bound.

R3: `scripts/release.py` packages an exact Git commit reproducibly, includes previously omitted package metadata, validates file hashes and rejects unsafe/incomplete archives. `scripts/update.py` plus `deploy/update.example.json` implement an administrator-only, parameterized update of an existing installation. Effective unit/drop-in/environment/config fingerprints detect drift without printing secrets. Tests run unprivileged in a disposable profile with production data/profile/control paths hidden. Update checks idleness, preserves configuration, backs up stopped state, verifies version/schema after restart and restores matching application/state on ordinary failure. Rollback preserves ownership and never restores native profiles/renewal journals outside state. No check waiver, namespace relaxation, native CLI installation or model call.

## Validation

TypeScript passed. Full local suite: 105 tests, 98 passed, 7 Linux-only skips, zero failures. Isolated VM candidate: 105 passed, zero failures/skips with `node scripts/test-isolation-ci.mjs`. Python release/update fixtures additionally cover deterministic exact-commit archives, dirty-file exclusion, hash mismatch, unsafe archives, idle/future-schema refusal, effective-state binding and secret-free fingerprints, pre-swap drift rejection, failed-readiness app/state rollback and successful release recording. Targeted schema cases cover legacy ancestry, failed ancestry and malformed-check recovery rollback, missing-index refusal and byte-identical future-schema rejection with worker markers preserved. The desktop sandbox initially prevented socket tests; the permitted local rerun passed. No live model or native account-consent requests. Final staged archive rerun: 105 passed, zero skips/failures. GitHub CI at `af7ca04` passed Node 24, Node 26 and Required Linux isolation (both push and PR runs). Full root/systemd deployment is not performed here; it remains administrator acceptance.

## Deployment and rollback

Not deployed. Tracked procedure and limitations: `docs/managed-updates.md`. Source-only release archive, verifier, root-adoptable configuration and a thin launcher are staged in the operator account, outside the public repository. The launcher executes the tracked updater; it contains no separate update logic. Production 0.20.0 continues running. Application update intentionally preserves the agentd project checkout; application release and project revision can differ.

Power-loss rollback is not automatic: a private pending journal blocks further updates until administrator recovery. Source hashes are integrity evidence, not release signatures. First adoption requires explicit acceptance of existing configuration; drift reconciliation remains manual. Fresh account/TLS/native CLI setup and future GUI administration remain separate work. Do not downgrade by changing application files alone: older unversioned code can accept newer databases; restore a matching state backup.

## Next steps for Claude

Review transaction boundaries, known legacy shapes, future-version rejection before cleanup, artifact allowlists, baseline drift detection, non-root validation boundary, stopped-state backups/ownership, rollback and interrupted-update instructions. Focus on false assurances: fixture rollback is not a real privileged deployment test, and green tests do not authorize production installation.

The candidate is prepared for administrator installation; verify final PR/CI status and installed health after the operator runs it. Resolve R1 reviewed baseline and required CI enforcement with the operator before merging. Next engineering work is remaining R2 decomposition and R5/R6 boundary/resource controls; keep remaining UX/phone acceptance and U1 decision visible.
