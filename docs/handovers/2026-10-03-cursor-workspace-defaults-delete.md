# 2026-10-03 — 0.604.0: Workspace defaults + project delete

- Author/agent: Cursor
- Requested outcome: AgentD-wide Workspace defaults (look, run defaults, delete policy, behaviour) and project delete with A/B scope plus grace/immediate purge
- Status: implemented
- Release: 0.604.0

## Changes

- `workspace_preferences` SQLite row + `workspace-preferences` / `workspace-preferences-save` ops; Settings form with step-up access key; theme/density/notice/drawer behaviour applied client-side with localStorage cache.
- Run defaults feed a Workspace layer ahead of project/conversation `execution_settings`.
- `project-delete` / `project-delete-cancel` / `project-purge` with `deleted_at`, `delete_scope` (`agentd` | `agentd_and_checkout`), `purge_after`; retention tick purges when due; B only removes AgentD-managed checkouts under `projectsDir`.
- GUI: Workspace defaults in Settings; Delete project… wizard in Project settings; Cancel delete in History archived list during grace.

## Validation

- `node --test test/workspace-preferences.test.mjs test/ui.test.mjs`
- Busy project refuse, A keep checkout, B remove managed checkout, grace cancel covered.

## Follow-up

1. Live-install 0.604.0 on 192.168.1.20 after merge.
2. Optional: surface pending-delete countdown more prominently in History.
