# Automatic model and effort selection — backlog requirements

Requested by the operator on 2026-09-28. Planned alongside configurable agent settings after the GitHub workflow and Cursor CLI integration. Define the shared adapter capability model during Cursor work; these controls are not yet implemented.

## Goal and selection

Choose a model and reasoning effort appropriate to each task, minimizing avoidable subscription usage without sacrificing the required quality. Simple questions, narrow edits and routine checks should not automatically consume the strongest model at maximum effort. Architecture, ambiguous debugging, security-sensitive changes and complex multi-file work may justify stronger reasoning from the start.

Use task type, ambiguity, scope, risk, available context, previous failures and verifiable results. Prefer deterministic routing rules first; do not spend a heavyweight model request just to classify a simple task. If a lightweight planning call is warranted, count and disclose it. Compare expected total work, including retries: the smallest model is not always the most economical choice. Do not equate output length with reasoning effort or assume effort labels mean the same thing across providers.

The orchestrator owns and enforces the selection policy. Workers may propose a change with a reason; they cannot silently choose unlimited resources. Native automatic model routing is a distinct option, not a claim that agentd knows the model a provider actually selected.

## GUI and manual control

Support Auto or an explicit model, and Auto or an explicit supported effort independently. Allow project defaults, project-specific agent settings, conversation overrides, conversation-specific agent settings and a next-run override. Use the same visible inheritance and reset controls as environment settings. A manually pinned choice must not be silently replaced by automatic routing.

Before approval, display the selected agent, requested model, effort, Auto/manual source, and a short reason such as “Small documentation edit; light reasoning should be sufficient.” Show these in the running task and retained run history too. Distinguish the requested choice from the actual model reported by the native CLI; if actual model or effort cannot be verified, label it unknown or provider-managed. Record policy version and selection rationale for audit and troubleshooting, without requesting private chain-of-thought.

Model/effort controls must list only supported combinations for the installed CLI and current account where discoverable. Handle removed models, unavailable subscriptions and unsupported effort controls explicitly. Never pass arbitrary user-entered flags, fall back silently, or infer availability from installation alone. Selecting a model does not expand tool, filesystem or network permissions.

## Resource policy and escalation

Offer a clear default preference for the least costly capable choice. Allow limits on automatic escalation, attempts and run duration, and an allowed-model list per agent. Use reliable reported usage when available; label estimates as estimates and usage as unavailable otherwise. Subscription consumption is not interchangeable with a cash/token price, and no precise savings promise can be made without measurements.

Escalate only with a concrete reason, such as unresolved ambiguity or failed task validation. A sign-in, network or sandbox failure should trigger recovery, not a more expensive model. Avoid unbounded retries and cycles between agents. Display escalation events and the new choice. Changes beyond the user's approved model/effort envelope require fresh approval; never enable paid overages or switch to separately billed API credentials automatically.

## Changes during a conversation

Settings are editable at any time. Apply them to future turns; show which choice an active run is actually using. For a running task, use a validated native switch only if its semantics are supported and visible; otherwise offer stop/restart with preserved partial work and fresh approval. Pending tasks whose resolved selection changes must have their approval refreshed. Retry/resume must respect manual pins and current account capabilities, and preserve selection history across restart.

## Acceptance

Use fixtures to cover simple versus complex tasks, manual precedence, model/effort capability mismatches, bounded escalation, provider-managed/unknown results, stale account information, limits, queued/running changes and restart persistence. Verify that no routing decision bypasses run approval, security policy, or billing preferences. Validate desktop and phone controls. Evaluate routing quality on representative tasks using correctness and total attempts/usage, not just whether the selected model was cheap. Live subscription trials require an explicit small test budget; routine regression tests make no model requests.
