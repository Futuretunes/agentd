# Provider credits and subscription usage

Operations shows account-wide subscription quota separately from provider credit balances. Activity from other clients counts against the same provider account. No token-cost calculation is presented as remaining subscription allowance.

## Codex

The pinned native CLI app-server receives only `initialize`, `initialized`, `account/read` with `refreshToken:false`, and `account/rateLimits/read`. No thread, turn, tool, login, reset-credit consumption or purchase request is sent. The helper runs in an empty read-only sandbox with provider-only egress and a disposable access-only credential snapshot. Real account files and refresh grants are absent; no credentials are sent to the browser. The CLI version is checked against the tested pin. Expired access may require Operations reconnect; usage reading does not initiate renewal.

Only numeric quota windows, bounded bucket identifiers, optional numeric credit balances/flags and available reset count are retained. Multi-bucket data takes precedence over the legacy single bucket. Missing fields remain unknown. Remaining percent is clamped at zero; credit units are provider credits, not an inferred dollar balance. Percentages do not predict how many prompts remain.

Account probes refresh while idle on the existing five-minute schedule; the refresh button can request an earlier read with a one-minute minimum between usage attempts. Existing account/worker/renewal admission rules apply. The in-memory cache is cleared on account changes, signed-out/unverified status and restart. After five minutes, a failed refresh or a provider reset timestamp passing, previous data is explicitly stale. A passed reset timestamp never implies replenishment without another successful read. Shutdown aborts and awaits the probe. UI low-allowance guidance uses fresh windows only (10% or less); it does not automatically reject queued tasks, consume earned resets or enable paid overages.

## Claude and Cursor

The reviewed Claude documentation exposes subscription bars in interactive `/usage` and the provider settings page, but no supported headless quota query was established. Cursor's reviewed CLI reference exposes authentication status and models, not a quota endpoint. Operations offers fixed usage-page links and says unavailable; no passwords, session-cookie scraping, private endpoints or model prompts are used to manufacture a balance. Browser login may be needed and can represent a different account; verify the provider account there.

## Evidence and acceptance

Fixture tests cover read-only RPC sequencing, hostile/malformed/oversized output, cancellation, field minimization, cache behavior, account changes, shutdown and UI labels. A required Linux test executes the entire probe using a synthetic CLI, verifies the empty read-only workspace and absent refresh grant, preserves original credentials and confirms cleanup. `scripts/usage-preflight.mjs`, run as the installed service user, can verify native metadata without printing balances or account identity. Live installed-native acceptance is pending until deployment; no model request is needed.

Official sources checked 2026-09-29:

- [Codex app-server rate limits](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt)
- [Claude usage and costs](https://code.claude.com/docs/en/costs)
- [Claude CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Cursor CLI reference](https://cursor.com/docs/cli/reference/parameters)
- [Cursor models and pricing](https://cursor.com/docs/models-and-pricing)
