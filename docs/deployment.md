# Linux deployment

These instructions describe a fresh deployment. Do not run them blindly over an existing instance. Back up `/opt/agentd` and the state databases before upgrading. Native CLI installation and account login are separate operator steps; no credentials belong in this repository.

## Service account and files

Install Node.js 24+ at `/usr/local/bin/node` (or adjust both unit files), Git, Python 3 and OpenSSL using trusted distribution/vendor installation instructions. Create a dedicated account with home `/var/lib/agentd`, without sudo privileges:

```sh
sudo useradd --system --create-home --home-dir /var/lib/agentd --shell /bin/bash agentd
sudo chmod 700 /var/lib/agentd
sudo install -d -o agentd -g agentd -m 700 /srv/agentd/state/attachments /srv/agentd/worktrees/tasks /srv/agentd/logs/tasks /srv/agentd/repos
sudo install -d -o root -g agentd -m 750 /etc/agentd /etc/agentd/tls
sudo install -d -o root -g root -m 755 /opt/agentd
sudo cp -R src public /opt/agentd/
sudo chown -R root:root /opt/agentd
sudo cp .env.example /etc/agentd/agentd.env
sudo chmod 640 /etc/agentd/agentd.env
sudo chown root:agentd /etc/agentd/agentd.env
```

Provision a local repository under `/srv/agentd/repos/` owned by agentd, and edit `AGENTD_REPO` in `/etc/agentd/agentd.env`. It must contain a commit. Install and authenticate native CLIs under the agentd account; verify their paths match the environment file. The runner does not forward provider API-key environment variables.

```sh
sudo install -m 644 deploy/agentd.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agentd
curl http://127.0.0.1:8787/healthz
```

The unit retains `AF_NETLINK` because Codex's Linux sandbox needs a netlink socket to initialize its network namespace. The process still has no Linux capabilities and no sudo access.

## Mobile gateway

Provide a TLS certificate and private key for your actual hostname or IP. Keep the private key root:agentd, mode 640. Self-signed certificates require an explicit trust decision on your device. Use a trusted private network initially.

Create `/etc/agentd/mobile.json` with this shape, substituting your real values. All filesystem paths must be absolute:

```json
{
  "host": "127.0.0.1",
  "port": 8788,
  "origin": "https://localhost:8788",
  "key": "/etc/agentd/tls/mobile.key",
  "cert": "/etc/agentd/tls/mobile.crt",
  "accessHash": "REPLACE_WITH_SHA256_OF_RANDOM_ACCESS_KEY",
  "socket": "/run/agentd/control.sock",
  "attachments": "/srv/agentd/state/attachments",
  "publicDir": "/opt/agentd/public"
}
```

Set `host` to the private interface address for phone access, and make `origin` exactly match the browser URL, including port. No wildcard origin is supported. Keep the JSON root:agentd, mode 640. Generate a random access key locally and store only its SHA-256 hex digest in `accessHash`. Never put the plaintext key in a URL or source control. Use the plaintext key to sign in from the phone.

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
- Rollback: retain a copy of the previous application and matching database backup. No automated downgrade mechanism is supplied.
- Cleanup: automatic retention is not implemented. Never remove a worktree used by an active task.

The example systemd units assume `/usr/local/bin/node` and the directory layout above. They are templates, not a universal installer. Do not expose the POC publicly without additional authentication, worker isolation and deployment review.
