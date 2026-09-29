# 2026-09-29 — Provider credit and quota reporting

- Author: Codex; explicitly prioritized by the operator over remaining stabilization work.
- Status: implemented; exact validation pending; not installed.
- Release: cumulative 0.41.0, task schema 2.
- Branch/base: `feat/provider-usage` from `refactor/task-execution-owner` at `19cf02c`.

## Change

Operations now renders Codex quota windows, remaining percentage/reset times, optional provider credit balances and earned reset counts. Fresh low-allowance guidance and last-checked/stale states avoid invented zeroes or reset assumptions. Claude/Cursor remain explicitly unavailable with fixed provider usage-page links. See [provider usage](../provider-usage.md) for official sources, limitations and acceptance.

`native-usage.ts` uses a fixed metadata-only app-server sequence, validated pin and bounded output/time. `usage-probe.ts` runs it in the existing empty read-only provider-only sandbox with access-only copied credentials and no repository. `provider-usage.ts` whitelists fields and owns an in-memory throttled cache. Runner account probes provide idle admission and account-change invalidation; shutdown aborts and waits. `public/ui.js` renders accessible quota bars separately from credits. No model, purchase, credit redemption, automatic renewal or authentication-consent flow is started.

## Validation

Fixture coverage includes RPC allowlist, server tool-request rejection, oversized output, cancellation, missing/hostile fields, multi-bucket precedence, stale/reset handling, refresh throttling, sign-out clearing, shutdown settlement and safe UI labels/links. The synthetic browser preview exposes correctly named progress indicators. A required Linux fixture covers the full isolated probe with synthetic credentials and verifies absent refresh grants, empty read-only workspace, hidden private state and cleanup. Exact archive and CI results pending. No live provider quota query or model request was run; the service account's native files are private to that account, and no privileged access was requested merely for validation.

## Deployment and rollback

Production remains 0.22.0/task schema 1. Keep the prior validated cumulative installer until this candidate passes. Task schema stays 2; rollback needs matching application/task state, preserving native profiles separately. After install, open Operations and Refresh accounts and usage. Use the tracked usage preflight only as the service user if needed; it prints metadata success/failure rather than identities or balances. Native acceptance remains pending.

## Remaining work

Supported Claude/Cursor headless usage interfaces and structured provider-limit task failures remain open. No reset-credit redemption or billing controls were added. No quota-based scheduling promises are made. Continue asynchronous request-time Git and safe cleanup reconciliation after this operator-prioritized item. Shared Claude review and consolidation of the cumulative release remain pending; no main merge is authorized.
