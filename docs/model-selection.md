# Model and effort selection

Implemented in v0.19.0 through **Agent settings**, using the same scope hierarchy as [permissions](environment-permissions.md). Defaults remain **Provider default**, preserving existing behavior. Choose **Auto** or a listed native model; reasoning effort is independently inherited, automatic, provider-managed or explicitly selected where supported. **Next run only** saves a browser-tab draft override, consumed on submission.

## What is requested and what is known

Each pending run displays its requested model, effort, selection reason and inheritance before approval. The immutable run snapshot retains those values in history. Actual model/effort remain explicitly unknown/provider-managed: a native alias, provider routing or organization policy may differ from the request. CLI installation and metadata do not prove subscription entitlement. Providers verify availability when a run starts; failure does not silently substitute another model.

**Refresh native models** makes metadata requests only. It does not create a model conversation or submit a prompt. Failed refreshes preserve the previous catalog with an error/freshness indicator. Account changes invalidate cached choices. Removed explicit model pins block pending work rather than falling back. Refresh requires idle workers and account operations. Metadata and selection use the tested CLI versions; an unexpected executable version blocks explicit selection pending compatibility verification.

- **Claude Code 2.1.283:** native Haiku, Sonnet and Opus aliases after verifying CLI model/effort flags. Sonnet/Opus offer low/medium/high; Haiku has no independent effort in this adapter. These are CLI aliases, not account-specific entitlement discovery.
- **Codex 0.157.1:** native app-server `model/list` metadata, including advertised effort levels. No thread or turn is created. Selection is passed into the existing tool-free Chat-only invocation; repository inspection/editing remain disabled.
- **Cursor 2026.09.26-dd393fe:** native `models` output, normally requiring sign-in. Explicit model IDs are passed to the same restricted ACP worker. Independent effort is unavailable; listed model variants may encode provider reasoning choices. No guessed model IDs are added.

## Auto routing

Auto is agentd's deterministic policy, version 1. A short summary/explanation/README or typo task chooses an approved light tier; security/authentication, architecture, migration, race/deadlock, cryptography, multi-file work or a long prompt chooses a deep tier; otherwise it chooses a balanced tier. It uses only known tier mappings: Claude aliases and the verified Codex GPT-6 family. With no suitable mapped model, Auto explicitly requests Provider default and records why. Cursor currently has no agentd tier mapping.

Auto effort requests low/medium/high for the corresponding task class only where the chosen model advertises it, otherwise an available medium or Provider default. Explicit unsupported combinations are rejected. Manual model pins are never replaced. Shared cross-agent scopes support Auto/Provider default; concrete models belong to per-agent or next-run scopes.

This is a first routing heuristic, not measured cost optimization. There is no classifier call, automatic retry, model escalation, API-key fallback, paid-overage change or precise credit estimate. Provider billing settings remain provider-controlled. Usage is unavailable until a reliable native interface exists.

## Validation and remaining work

Fixture tests cover precedence, manual pins, unsupported combinations, sanitized metadata, literal arguments, stale approvals and account/worker concurrency. An offline real-Codex test verifies requested model/effort on the outgoing request while proving zero tools are advertised and injected calls remain rejected. Claude/Codex native metadata was verified without credentials or model calls. Cursor's authenticated catalog and live selected-model acceptance remain operator checks.

Future work: account-specific capability reporting where supported, actual-model reporting, richer native effort controls, measured routing quality, explicit allowed-model budgets and separately approved bounded escalation. None may widen environment permissions.

Native references: [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-reference), [Claude model configuration](https://code.claude.com/docs/en/model-config), [Cursor CLI parameters](https://cursor.com/docs/cli/reference/parameters).
