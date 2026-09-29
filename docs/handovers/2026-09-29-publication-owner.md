# 2026-09-29 — Publication and feedback operation ownership

- Author: Codex; authorized overnight R2 work.
- Status: implemented; exact cumulative validation pending; not installed.
- Release: cumulative 0.38.0, task schema 2.
- Branch/base: `refactor/publication-operation-owner` from `fix/dependency-publication-recovery` at `b5a3ee8`.

## Changes

`publication-jobs.ts` extracts publication previews/approvals, feedback selection and base integration from the runner. Publishing and feedback deliberately share one `operationSlot`; they cannot acquire independent overlapping leases. The runner still supplies the directional admission policy, native profile and task/approval helpers. Existing owner, expiry, exact commit/check, fingerprint, conversation and conflict checks remain in the domain.

Shutdown closes manager admission, aborts and awaits the owned operation before the database closes. A shutdown before the operation's first microtask records failure without invoking transport. Approved publication interruption remains `needs_attention`: cancellation is not a claim that remote writes were undone. Unexpected persistence errors are not suppressed. Synchronous feedback application remains transactional with its previous cleanup behavior.

## Validation

Existing publication and feedback fixtures cover exact approval, remote races, uncertain responses, restart recovery, selected comments and conflict integration. Added regressions cover immediate shutdown without transport for both domains, mutual exclusion while transport runs, shutdown waiting for aborted transport settlement, and needs-attention for interrupted publication approval. Exact archive/full Linux and CI results will be recorded after validation. No live GitHub publication, model request, account consent, deployment or retention deletion is used.

## Deployment and limitations

Production remains 0.22.0/task schema 1. Keep the previous fully validated cumulative installer until this candidate passes exact validation. Schema remains 2; rollback requires matching saved application/task state, preserving native profiles separately. The manager is an in-process owner, not a distributed lock or remote transaction. This does not make request-time integration Git asynchronous or redesign the directional admission matrix.

## Next work

Continue R10 asynchronous request-time review/integration Git and recovery, R2 task/check decomposition, and R6 cleanup crash reconciliation. Update the shared handover after each bounded item; keep operator installation separate.
