# 2026-09-28 — Separate web gateway

- Author: Codex.
- Request: implement the separate web gateway (R5).
- Status: implemented and staged; exact-archive Linux validation and CI passed; installation pending.
- Release: 0.22.0, task schema remains 1.
- Branch: `feat/separate-web-gateway`, based on `fix/candidate-validation-boundaries` at `9c79a0a` (installed 0.21.2 application retained).
- Draft PR: [#25](https://github.com/Futuretunes/agentd/pull/25), based on #24.
- Staged source: `8f033343a929047addbe6785d59ea7e42f0c9d46`; archive SHA-256 `06c1e0a190105214a1ee7dbb0d20a348078778ce18ce692724f3302199018326`. Later documentation commits do not change this staged archive.

## Changes

`src/gateway-protocol.ts` is the explicit runner-side operation/field boundary. The runner optionally serves a second group-scoped Unix socket, separate from the private administrative endpoint. Browser approvals require fingerprints at this boundary. Administrative registration, arbitrary dependency paths, audit and unknown operations fail closed. Owner-bound operations require browser owner hashes; existing domain checks remain.

`src/attachment-store.ts` moves upload/read storage into the runner. The gateway only reads static assets and its own TLS/configuration files, sends bounded image requests and retains HTTPS authentication/CSRF controls. File reads reject traversal, invalid metadata, symlinks and hard links. No public frontend changes overwrite Claude's work.

`deploy/` describes the separate `agentd-web` identity. `scripts/separate_gateway.py` is an explicit root-only, journalled transition after the ordinary managed app update. It preserves the old profile fingerprint format, validates drift/idleness, creates only the dedicated account/configuration/drop-ins, and records a new baseline only after `gateway_probe.py` verifies the live mount namespace under the actual gateway UID. Migration rollback restores the prior identity/configuration; native credentials/state are never reverted. `scripts/update.py` recognizes the new profile and hides its socket/configuration from candidate tests.

Read `docs/gateway-boundary.md` for the authority/residual-risk and two-stage rollback contract. A compromised gateway still has GUI authority and can impersonate human approvals; separation removes direct native-profile/admin/filesystem authority, not all trusted UI authority.

## Validation

Local typecheck passed. Complete local suite: 112 tests, 105 passed, seven Linux-only skips, zero failures. Targeted final protocol/HTTPS/runner/deployment tests passed. Python fixtures include both successful migration and rollback after failed boundary acceptance, plus separate-profile policy refusal. The exact staged archive passed all 112 tests on the Linux VM with zero failures/skips. CI run `36473590656` passed Node 24, Node 26 and required Linux isolation. Python migration fixtures also passed with umask 077, confirming gateway configuration directory permissions remain usable under the root launcher. Actual different-UID systemd acceptance runs during installation; it has not yet been run. No model requests, sign-in consent, root deployment or GUI acceptance were performed.

## Deployment

Installed remains 0.21.2. A verified managed archive and private thin launcher are staged in the operator account and perform the app update then invoke the installed root-owned migration. No first-adoption/drift bypass is used. During the intermediate old identity profile, large image uploads exceed the unchanged 80 KB admin socket limit; complete identity migration before GUI use. Dedicated gateway uploads have their own bounded larger envelope. Automatic approval review rejected expanding the old admin socket limit, so that expansion was not made.

Migration failure leaves the compatible 0.22 application with prior identity/configuration and a private journal requiring review. Abrupt-power-loss automatic recovery is not claimed. Identity migration supports the established standard layout only. All operator-specific paths/backup names stay in private staging/output.

## Next

Claude: review the protocol, service group ownership, migration rollback and managed baseline changes in draft #25. The operator has one staged administrator command. After operator installation, independently verify health/identity and record actual deployment acceptance separately from fixtures. Then R6 resource/retention controls; R1 merge strategy and protected-branch settings remain unresolved. Do not merge main or close the existing PR stack based on this note.
