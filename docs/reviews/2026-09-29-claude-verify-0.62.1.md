# 2026-09-29 — Claude verification of installed 0.62.1

The operator asked Claude to verify the staged 0.62.1 installation. It was already installed (15:52 UTC, starts 47). Claude made one permission repair on the host (A1) and no code changes. Codex: verify, don't accept; answer in `docs/reviews/2026-09-29-claude-verify-0.62.1-response.md`.

## Verified

- **Integrity.** Rebuilding the archive from GitHub commit `15df341c7e41cdf51f29e0cbab8e144efc9cb487` reproduces the staged archive's SHA-256 `803694890bf6…2c152c32` exactly. The launcher (`b4ad41e3…`) and recovery helper (`eb066e48…`) match the operator note.
- **Contents.** The commit contains Claude's 0.59.1 fixes and the administration backlog. `installed.json` records 0.62.1 / `15df341`, with no pending journals. Installed `src`, `public`, `scripts`, `test`, `deploy` and `package.json` match the commit, except for `scripts/__pycache__` (A4).
- **Tests.** Ubuntu with real isolation: typecheck, 212/212, 0 skipped. GitHub CI at `15df341`: Required Linux isolation, Node 24 and Node 26 all passed.
- **Services.** Runner, gateway and `agentd-admin.service` are active, with 0 restarts and no warnings since the install.
- **Gateway.** Hardening intact (exposure 1.4, Seccomp mode 2, runs as `agentd-web`); the separate gateway and resource profile are recorded.
- **Admin helper boundary, probed live.** It runs as root with NoNewPrivileges, ProtectSystem=strict, PrivateNetwork, AF_UNIX only, and only the CAP_CHOWN capability.
  - The socket is `root:agentd 660` in a `root:agentd 750` directory.
  - `agentd-web` and other users cannot connect.
  - As the runner, `exec`, an arbitrary-archive `install` and a smuggled field are all refused (`{"ok":false}`).
  - The code accepts exactly two operations with exact field sets.
- **Rotation flow.** Preview, fingerprint and a 5-minute expiry; the current key is needed at preview and approval; the generated key is 256-bit and custom keys are strength-checked. The gateway swaps the hash in memory immediately and invalidates other sessions. The write uses no symlinks, a root-owned file, write-then-rename and fsync. The rotation is audited (15:53:52 UTC, browser actor).
- **Diagnostics output** holds no secrets: release, configuration flags, service states and disk figures.

## Findings

### A1 (high) — access-key rotation made the gateway configuration unreadable (host repaired; code fix needed)

`src/admin-helper.ts` sets `process.umask(0o077)`, then `rotateAccessFile` writes the replacement with `mode: info.mode & 0o777`. The umask strips the group bit, so `/etc/agentd-web/mobile.json` went from `640 root:agentd-web` to **600** after the operator's GUI rotation at 15:53:52 UTC. `agentd-web` could no longer read it. The running gateway kept working with the in-memory hash, but **the next gateway restart or reboot would have failed**, locking the operator out of the phone UI.

Claude restored `chmod 640` on the host, with owner, group and content unchanged. `agentd-web` can read it, and the page returns 200. Nothing was restarted.

**Code fix:** `fchmod` the temporary file to the original mode after writing (independent of umask), and test rotation under `umask 077`, asserting the resulting mode equals the original. Also have the migration or diagnostics check that the gateway user can read its configuration.

### A2 (medium) — a supported rotation looks like configuration drift and blocks updates

The managed inventory hashes the full `mobile.json`, including `accessHash`. After any rotation, `update.py` / `apply_*` refuse with "Installed configuration drifted", and Diagnostics shows `configuration.state = drift`. Confirmed on the host: the only difference from the baseline is `/etc/agentd-web/mobile.json`.

**Fix:** exclude the operator secret (`accessHash`) from the configuration fingerprint, for example by hashing the JSON with `accessHash` masked. Do not simply re-baseline: other edits to that file must still count as drift. The next release then needs a one-time reconciliation on this host, which is safe because the only difference is the audited rotation.

### A3 (low) — current-key checks on `/api/access-key` are not rate-limited

The login attempt limiter only covers `/api/login`. An authenticated session can make unlimited current-key guesses through preview and approve. Impact is limited (it needs a session, and the current key is strong), but the step-up check should share the limiter.

### A4 (low) — root runs the updater scripts without `-B`

The launcher calls `python3 /opt/agentd/scripts/*.py` as root without `-B`, so `scripts/__pycache__` is written into the root-owned application. Use `python3 -B`, as `admin-helper.ts` already does.

### A5 (info) — stale plaintext key file

`/etc/agentd/mobile-access.txt` (root 600) still holds the pre-rotation key. It no longer grants access. Per O2 and `docs/administration.md`, the rotation flow should offer to delete it. The operator can delete it now.
