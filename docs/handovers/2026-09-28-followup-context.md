# 2026-09-28 — Explicit follow-up context

- Author: Codex; overnight backlog R16.
- Branch: `feat/followup-context` from `fix/public-error-boundary` at `8790d45`.
- Release: cumulative 0.31.0, task schema 1; not installed, production remains 0.22.0.

## Changes

`followup-context.ts` reads bounded completed saved answers only, refusing links/non-regular or inconsistent reads and never falling back to raw execution logs. JSON reference data includes a bounded excerpt of the previous question and shortening metadata. `execution-settings.ts` adds inherited/next-run context choices. Runner binds the exact reference hash/source to approval fingerprints and checks it again before invoking the agent. UI settings and run details expose the choice.

Defaults preserve previous completed-answer continuity; no-context does not change repository revisions or saved edit snapshots. Missing/legacy/failed parent output is omitted. Encoding and labels are not claimed as an injection defense; isolation/approval boundaries are unchanged. See `docs/followup-context.md`.

## Validation

13 focused tests passed: reference bounds/JSON encoding, no raw-log fallback, unsafe-link refusal, per-run opt-out, inherited choice, changed-answer approval invalidation, attachments and snapshot-preserving revisions. A prior fixture matched the old prompt heading; it now selects the intended revision instruction independently of that heading. Typecheck passed. Exact archive `ed78bdb` passed typecheck and 132/132 Linux tests with zero skips/failures; CI `36482120703` passed. Archive SHA256 `245549f1e1aa7fea8c2ab2934688f0f1cad55af1a4165a7d3e86a3005f87ad6e`. [Draft #34](https://github.com/Futuretunes/agentd/pull/34) targets the browser-error branch. No production, model, account or publication action.

## Next

Continue R10 durable creation receipts and asynchronous-operation work. Prepare one cumulative managed update plus resource profile transition, not intermediate feature installs. No new schema migration for this context setting. Pending approvals from older releases refresh under the new declared context policy.
