# Linux deployment

These instructions describe a fresh deployment. Do not run them blindly over an existing instance. Back up `/opt/agentd` and the state databases before upgrading. Native CLI installation and account login are separate operator steps; no credentials belong in this repository.

## Service account and files

Install Node.js 24+ at `/usr/local/bin/node` (or adjust both unit files), Git, Python 3 and OpenSSL using trusted distribution/vendor installation instructions. Create a dedicated account with home `/var/lib/agentd`, without sudo privileges:

```sh
sudo useradd --system --create-home --home-dir /var/lib/agentd --shell /bin/bash agentd
sudo chmod 700 /var/lib/agentd
sudo groupadd --system agentd-web
sudo useradd --system --gid agentd-web --home-dir /nonexistent --no-create-home --shell /usr/sbin/nologin agentd-web
sudo install -d -o root -g agentd-web -m 750 /etc/agentd-web
sudo install -d -o agentd -g agentd -m 700 /srv/agentd/state/attachments /srv/agentd/worktrees/tasks /srv/agentd/logs/tasks /srv/agentd/repos
sudo install -d -o root -g agentd -m 750 /etc/agentd /etc/agentd/tls
sudo install -d -o root -g root -m 755 /opt/agentd
sudo cp -R src public scripts test docs deploy /opt/agentd/
sudo cp package.json package-lock.json tsconfig.json README.md LICENSE /opt/agentd/
sudo chown -R root:root /opt/agentd
sudo cp .env.example /etc/agentd/agentd.env
sudo chmod 640 /etc/agentd/agentd.env
sudo chown root:agentd /etc/agentd/agentd.env
```

Set `AGENTD_GATEWAY_GID` in `/etc/agentd/agentd.env` to the numeric result of `getent group agentd-web` (its third field). The runner receives the gateway group through its unit, not through a shared login account.

Provision a local repository under `/srv/agentd/repos/` owned by agentd, and edit `AGENTD_REPO` in `/etc/agentd/agentd.env`. It must contain a commit. Install and authenticate native CLIs under the agentd account; verify their paths match the environment file. The runner does not forward provider API-key environment variables.

```sh
sudo install -m 644 deploy/agentd.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agentd
curl http://127.0.0.1:8787/healthz
```

The unit retains `AF_NETLINK` for sandbox namespace setup. `ProtectKernelTunables` must remain disabled: that systemd option adds protective mounts below `/proc`, making the parent procfs incomplete; Linux then rejects bubblewrap's procfs mount in an unprivileged user namespace with `Can't mount proc ... Operation not permitted`. The dedicated `agentd` user has no sudo access, and `NoNewPrivileges=true` plus an empty capability bounding set prevent it from changing host kernel tunables. Other unit protections remain enabled.

## Mobile gateway

Provide a TLS certificate and private key for your actual hostname or IP. Keep the private key root:agentd-web, mode 640, under `/etc/agentd-web/`. Self-signed certificates require an explicit trust decision on your device. Use a trusted private network initially.

Create `/etc/agentd-web/mobile.json` with this shape, substituting your real values. All filesystem paths must be absolute:

```json
{
  "host": "127.0.0.1",
  "port": 8788,
  "origin": "https://localhost:8788",
  "key": "/etc/agentd-web/tls.key",
  "cert": "/etc/agentd-web/tls.crt",
  "accessHash": "REPLACE_WITH_SHA256_OF_RANDOM_ACCESS_KEY",
  "socket": "/run/agentd-web/gateway.sock",
  "publicDir": "/opt/agentd/public"
}
```

Set `host` to the private interface address for phone access, and make `origin` exactly match the browser URL, including port. No wildcard origin is supported. Keep the JSON root:agentd-web, mode 640. Generate a random access key locally and store only its SHA-256 hex digest in `accessHash`. Never put the plaintext key in a URL or source control. Use the plaintext key to sign in from the phone.

```sh
sudo install -m 644 deploy/agentd-mobile.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agentd-mobile
```

The gateway configuration location can be overridden with `AGENTD_MOBILE_CONFIG`. To rotate access, replace the hash with that of a new random key and restart only `agentd-mobile`. Existing mobile sessions are invalidated; worker tasks continue.

## Operations

- Logs: `journalctl -u agentd -u agentd-mobile`; per-task logs live in the configured log directory.
- Metrics: `http://127.0.0.1:8787/metrics`. Configure a local scraper; no Grafana dashboard is bundled yet.
- Backup: stop the services before copying the entire state directory and retained worktrees/logs, or use SQLite-aware backups. Include attachment metadata and images. Protect backups as sensitive data.
- Rollback: retain a copy of the previous application and matching database backup. The tracked updater restores the matching application/state on ordinary update failure. Manual downgrade still requires a matching backup; see [managed updates](managed-updates.md).
- Cleanup: automatic retention is not implemented. Never remove a worktree used by an active task.

The example systemd units assume `/usr/local/bin/node` and the directory layout above. They are templates, not a universal installer. Do not expose the POC publicly without additional authentication, worker isolation and deployment review.

## Repeatable releases and updates

Use the [tracked release and update workflow](managed-updates.md) for existing instances. It records an exact source revision, verifies the archive, detects configuration drift and preserves installed units/configuration. Fresh provisioning above remains an explicit administrator task. No GUI or worker receives deployment privileges.

The web service has no shared writable directories with the runner. Images are stored by the runner through the restricted socket. For existing installations, use the explicit [gateway identity migration](gateway-boundary.md); copying the new unit templates over live units is not an upgrade procedure.
