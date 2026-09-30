# 2026-09-30 — 0.83.1: Harden settings restart partial.txt wait (known flake)

- Author/agent: Cursor
- Requested outcome: stop live-install flakes on `running attempts retain settings; restart preserves partial edits and requires a separate approval` after 0.83.0 host isolation failure
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.83.1
- Branch and base: `fix/settings-restart-flake` on `main` (0.83.0)
- Implementation commit(s): `786b3cd`
- PR: #107
- Known flake: recorded in [2026-09-29-claude-0.64.1.md](2026-09-29-claude-0.64.1.md) (CI timeout waiting for `partial.txt`, actual empty / expected `keep me`)

## Changes and relevant files

- `test/settings.test.mjs`: extract `waitForFile` (~20s / 2000×10ms) for hang-fixture `partial.txt` waits in the restart-settings and restart-start tests; fail with `timed out waiting for …` instead of a bare existence assert after a short 4s budget.
- No product code changes.
- `package.json` → 0.83.1.

## Validation evidence

- CI green on #107; live-installed on 192.168.1.20 (0.83.1 / 6fae2d3690c6).

- `npm run format` / `npm run typecheck`
- Repeated `node --test --test-name-pattern='running attempts retain settings' test/settings.test.mjs` (and related hang wait coverage via the same file’s restart-start test when run)

## Deployment and rollback

Not installed. Rollback is prior 0.83.0; test-only change.

## Constraints and known issues

- Hardens the known flake wait budget; does not change hang-fixture or runner scheduling. If the file never appears, the test still fails with a clearer timeout message.

## Next steps

1. Merge when CI is green; live-install on the host if desired after merge.
2. Do not merge/install from this agent pass unless the operator asks.
