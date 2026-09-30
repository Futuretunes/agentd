# 2026-09-30 — 0.77.0: Delete leftover access-key recovery file (O2)

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Access key can delete leftover `/etc/agentd/mobile-access.txt`
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.77.0
- Branch and base: `feat/gui-access-key-recovery-delete` on `main` (0.76.0)
- PR: #93

## Changes and relevant files

- Helper: status/delete of fixed root-only recovery path; never returns contents.
- Gateway/mobile/UI: step-up preview delete from Access key settings.
- Closes administration O2 offer for leftover plaintext recovery file.

## Validation evidence

- `node --test test/access-key-recovery.test.mjs`
- CI green on #93; live-installed on 192.168.1.20; recovery status `present: false`.

## Next steps

1. Next backlog: notifications (roadmap item 5 / ntfy) or remaining Configuration polish.
