# 2026-09-30 — 0.77.0: Delete leftover access-key recovery file (O2)

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Access key can delete leftover `/etc/agentd/mobile-access.txt`
- Status: implemented; pending merge and live-install
- Release: 0.77.0
- Branch and base: `feat/gui-access-key-recovery-delete` on `main` (0.76.0)

## Changes and relevant files

- Helper: status/delete of fixed root-only recovery path; never returns contents.
- Gateway/mobile/UI: step-up preview delete from Access key settings.
- Closes administration O2 offer for leftover plaintext recovery file.

## Validation evidence

- `node --test test/access-key-recovery.test.mjs`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Host may already lack the file; UI then shows that no leftover file is present.
3. Next backlog: notifications (ntfy) or remaining Configuration polish.
