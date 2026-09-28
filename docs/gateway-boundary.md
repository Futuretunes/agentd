# Separate web gateway (0.22.0)

The web service runs as `agentd-web`, while the orchestrator and native profiles remain under `agentd`. The web identity has no login shell, home profile, sudo rights or runner group membership. Its root-owned configuration directory contains only its TLS files and access-key hash. The browser URL and access key do not change; restarting the gateway ends existing browser sessions.

## Authority

The runner retains its private administrative socket. A second socket in a separate runtime directory accepts an explicit operation and top-level field allowlist (`src/gateway-protocol.ts`). Unknown operations, administrative registration/dependency-path operations, extra fields, absent browser owners for owner-bound operations and approvals without a preview fingerprint fail closed. Runner domain checks still enforce project scope, adapter ceilings, task state and exact-content approvals. Future runner operations are not automatically exposed.

The web service cannot directly read native credentials, repository contents, task databases, logs or the administrative socket. Its unit masks the runner's storage, native home, private runtime and original configuration directory. It receives images through bounded runner operations; it no longer mounts a writable attachment directory. Image IDs and metadata are validated, reads refuse symlinks/hard links and upload budgets remain enforced. The administrative socket retains its existing 80 KB limit; the gateway has a 7.5 MB upload envelope, 80 KB ordinary request limit, 16-connection cap and ten-second idle timeout.

This is a service boundary, not a separate human authorization authority. A compromised web process can still perform permitted browser operations, read UI-visible task content, impersonate a browser session or submit approvals. The runner cannot prove a human clicked a button merely from a gateway-supplied owner hash. Native credentials are never intentionally returned by the protocol, but task output remains user/agent content. This change does not certify all existing runner operations against arbitrary malicious input.

## Managed transition

Existing managed standard-layout installations first install the reviewed 0.22.0 application using `scripts/update.py`, preserving existing units and their drift baseline. Then run the installed, root-owned migration:

```sh
sudo python3 -B /opt/agentd/scripts/separate_gateway.py --config /etc/agentd/update.json
```

The operator launcher combines both steps. The migration refuses unsupported paths, existing migration files, configuration drift, concurrent updates, pending recovery or active work. It creates a dedicated account, stops both services, copies only gateway TLS/configuration files, adds narrowly scoped drop-ins and verifies the target unit policy before restart. It preserves the runner's existing hardening, full procfs and AF_NETLINK needed for bubblewrap.

Acceptance runs a read-only probe **as the actual web UID inside the live gateway mount namespace**: configuration/TLS and a project query must work; private directories, the administrative socket and raw administrative operations must be denied. Only after this check does the migration update the managed configuration/baseline. Future ordinary updates fingerprint the separate identity, groups, socket configuration, denied paths and TLS configuration. Their validation services hide both control sockets and all listed configuration files.

The application-only intermediate step is not completed separation. Until migration succeeds, the previous shared UID remains, and large image uploads cannot pass its unchanged administrative socket limit. Complete the migration before using uploads. This temporary compatibility limit does not apply to the dedicated gateway socket.

## Rollback and recovery

An ordinary migration failure restores the prior unit drop-ins, original update configuration and original managed record, then restarts the prior service identities. It leaves the compatible 0.22 application installed, retains an inert dedicated account if created, and never restores native credentials or task state. Original gateway TLS/configuration files are unchanged. A root-only configuration backup and `gateway-pending.json` remain for administrator review; ordinary updates refuse while this marker exists.

For interrupted migration, stop both services, inspect the marker and backup, remove only `99-gateway-boundary.conf` from each unit's drop-in directory, restore the backup's `update.json` and `installed.json` to their original locations with mode 600, remove the migration-created `/etc/agentd-web` directory, reload systemd and restart. Verify the prior unit identities, health and baseline before removing the marker. Preserve diagnostic artifacts privately. Do not restore an older application against the new identity profile; reverse the identity migration first. Automatic power-loss recovery remains out of scope.

Fresh installations use the updated unit templates and an explicitly provisioned numeric `AGENTD_GATEWAY_GID`; see `docs/deployment.md`. The migration deliberately supports only the established standard layout. No GUI deployment privilege, provider request, account consent or external publication is part of this change.
