# 2026-09-28 — Scoped permissions and model selection

- Author/agent: Codex
- Requested outcome: per-project, per-conversation and per-agent permissions, followed by model/effort selection.
- Status: implemented and installed; live selected-model/GUI acceptance remains outstanding.
- Release: 0.19.0
- Branch: `feat/scoped-agent-settings`; base: `feat/cursor-cli`.
- Implementation: `0af41e25fbcc840cda0e24ec8c138b1cadfe13fb`.
- Draft PR: https://github.com/Futuretunes/agentd/pull/19, stacked on #18. Recheck current PR status before continuing.

## Changes and relevant files

- `src/execution-settings.ts`: inheritance, access profiles, bounded runtime, deterministic Auto routing and resolved snapshot fingerprints.
- `src/model-catalog.ts`: sanitized native metadata discovery, cached choices, account-change invalidation and supported CLI version checks.
- `src/runner.ts`: scoped settings persistence, stale approval rejection, dispatch rechecks and restart with preserved partial edits.
- `src/adapters.ts`, `src/codex-chat.ts`, `src/cursor-acp.ts`: literal model/effort arguments without expanding worker tools.
- `src/mobile.ts`, `public/app.js`, `public/style.css`: authenticated controls, inheritance/reset, next-run overrides and phone layout.
- `test/settings.test.mjs`, `test/mobile.test.mjs`, `scripts/chat-preflight.mjs`, `scripts/settings-preflight.mjs`: regression and native offline/metadata verification.
- `docs/environment-permissions.md`, `docs/model-selection.md`: behavior and remaining limitations.

Precedence: installation → project → project agent → conversation → conversation agent → next-run model/effort/runtime. Effective changes invalidate pending approvals. Active processes keep their snapshot; stop/restart with current settings preserves partial edits and requires approval. Provider default is retained unless the operator selects Auto or a specific model.

## Validation evidence

- `npm run typecheck`: passed locally and on Ubuntu.
- `npm test` on macOS: 84 passed, 7 Linux-only skips.
- `AGENTD_TEST_ISOLATION=1 npm test` on Ubuntu: 91/91 passed, no skips. Operator installation repeated all 91 successfully.
- GitHub CI Node 24 and 26: passed for the implementation commit.
- Real pinned Codex offline preflight verified Luna/low on the request and rejected injected tools with zero tools advertised.
- Operator installation verified native Claude, Codex and Cursor model metadata without model requests; native Claude/Cursor sandbox startup and dependency isolation preflights passed.
- Desktop/390px phone fixture checks covered inheritance, confirmation, overrides, reset, next-run persistence and model refresh.
- No live selected-model requests were submitted. Full provider acceptance, actual model/effort reporting and routing-quality evaluation are not established by these tests.

## Deployment and rollback

The operator supplied successful installation output: service version 0.19.0, starts 29, both services active, HEAD `0af41e2`. This is operator-reported evidence, not a fresh remote inspection.

The operator's VM has `agentd-update-settings.sh`, a staged settings release and a retained `agentd-settings-backup.*` backup. These are operator-specific artifacts outside the public repository. The update preserves credentials and their recovery journal on rollback. Do not reconstruct or run an installer from this note; inspect the actual artifacts first.

The instruction/handover documentation added afterward is a repository update; it does not change the installed application or require a service restart.

## Constraints and known issues

- Codex remains Chat only; Ask/Edit are blocked until native sandbox compatibility is solved without a bypass.
- Claude/Cursor retain isolated file-only tools and selected-provider egress. Shell, web, MCP, extra host paths and unrestricted network are not enabled by settings.
- Model metadata is not proof of subscription entitlement. Actual model/effort and usage remain unknown/provider-managed where unavailable.
- Auto uses local rules only, with no classifier request, retries, escalation, API credential fallback or paid-overage change.
- Cursor independent effort and automatic renewal remain unavailable. Native model variants may encode reasoning choices.
- Existing GUI GitHub publication, private import and some recovery/account journeys still need recorded live operator acceptance; see the roadmap.

## Next steps

1. When assigned, verify the GUI's scoped settings and a short selected-model run using an explicitly agreed live-test scope; record evidence without raw identities/tokens.
2. Recommended next implementation: ntfy approval/completion/failure notifications with authenticated task links, minimal payloads and duplicate prevention. This recommendation is not authorization to start it.
3. Then prioritize GUI updates/diagnostics/rollback toward terminal-free administration.
4. Read the roadmap before choosing other work. Keep review branches/worktrees separate if Claude and Codex work concurrently; do not overwrite uncommitted work or merge the stacked PRs automatically.
