# 2026-09-29 — Publication and feedback operation ownership

- Author: Codex; authorized overnight R2 work.
- Status: implemented; exact Linux and CI passed; not installed.
- Release: cumulative 0.38.0, task schema 2.
- Branch/base: `refactor/publication-operation-owner` from `fix/dependency-publication-recovery` at `b5a3ee8`.

## Changes

`publication-jobs.ts` extracts publication previews/approvals, feedback selection and base integration from the runner. Publishing and feedback deliberately share one `operationSlot`; they cannot acquire independent overlapping leases. The runner still supplies the directional admission policy, native profile and task/approval helpers. Existing owner, expiry, exact commit/check, fingerprint, conversation and conflict checks remain in the domain.

Shutdown closes manager admission, aborts and awaits the owned operation before the database closes. A shutdown before the operation's first microtask records failure without invoking transport. Approved publication interruption remains `needs_attention`: cancellation is not a claim that remote writes were undone. Unexpected persistence errors are not suppressed. Synchronous feedback application remains transactional with its previous cleanup behavior.

## Validation

Existing publication and feedback fixtures cover exact approval, remote races, uncertain responses, restart recovery, selected comments and conflict integration. Added regressions cover immediate shutdown without transport for both domains, mutual exclusion while transport runs, shutdown waiting for aborted transport settlement, and needs-attention for interrupted publication approval. Exact archive `5de9de5bd0655c0f6cbe0654eb725fe1016da192` passed 154/154 required Linux tests with zero skips, formatting and typecheck. SHA-256: `8058ba5e433d09f9e0fc488b94cc1ce897611664e1cec61d5f5ddef42100d05a`. CI run 36512779480 passed; draft PR #42 is open. No live GitHub publication, model request, account consent, deployment or retention deletion is used.

## Deployment and limitations

Production remains 0.22.0/task schema 1. The single private cumulative installer now targets this fully validated candidate; syntax and staged hashes are checked, and it remains unexecuted. Schema remains 2; rollback requires matching saved application/task state, preserving native profiles separately. The manager is an in-process owner, not a distributed lock or remote transaction. This does not make request-time integration Git asynchronous or redesign the directional admission matrix.

## Next work

Continue R10 asynchronous request-time review/integration Git and recovery, R2 task/check decomposition, and R6 cleanup crash reconciliation. Update the shared handover after each bounded item; keep operator installation separate.
