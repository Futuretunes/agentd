# 2026-09-28 — Native compatibility and limit visibility

- Author: Codex; overnight backlog R17.
- Branch: `feat/native-limit-status` from `feat/session-audit` at `8fa4821`.
- Release: cumulative 0.29.0, task schema 1. Not installed; production stays 0.22.0.

## Changes

`src/native-policy.ts` centralizes tested version strings and fixed native limits, consumed by adapters, model catalog, renewal and wrappers. Operations displays normalized observed version, tested version, freshness and mismatch/unavailable state. The asynchronous read-only version probe accepts only known version-string syntax and never emits raw output or identities. Custom worker fixtures do not probe installed binaries unless a test explicitly injects a version probe.

Approval payloads include native limits, making changed declared policy invalidate pending approvals through the existing fingerprint mechanism. Claude's native 16-turn cap and protocol-output ceilings are visible. The UI does not invent provider credits or diagnose a generic exit as a turn-limit failure. `docs/native-cli-updates.md` describes the reviewed native-update and rollback procedure.

## Validation

33 focused adapter/settings/chat/Cursor/runner tests passed. New fixtures cover matching/different/unrecognized version output and correspondence between displayed Claude limit and invocation arguments. Typecheck passed. Exact archive `c11b35f` passed typecheck and 128/128 Linux tests, zero skips/failures. CI `36480523050` passed; [draft #32](https://github.com/Futuretunes/agentd/pull/32) targets session-audit. Archive SHA256 `bd303b315bb69eb9f122d87fb1e1e09e13fc35fed658dbefc307aa5f0bfc81aa`. No live native version/account/model probe or production deployment performed for this item.

## Boundaries and next

Same versions, tool ceilings, host protections and credential policy; this adds visibility, not automatic updates. Version-string matching is not attestation or provider acceptance. Structured native stop reasons remain open. Complete exact validation and stage the cumulative operator update; continue R18 safe browser errors and R16 explicit follow-up context afterward.
