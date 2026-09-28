# Managed release updates

Candidate 0.21.0 introduces a tracked source-release builder and administrator-only updater. This replaces per-feature update logic; fresh account/TLS/native-CLI provisioning still follows [deployment](deployment.md). It does not merge Git branches, change the project checkout, install native CLIs, relax host protections, reconnect accounts or submit model tasks.

## Build and review

From a reviewed checkout, use the **full commit SHA**, not a moving branch name:

```sh
python3 scripts/release.py build --revision FULL_COMMIT_SHA --output /tmp/agentd-release.tar.gz
```

Record the printed SHA-256 separately. Same commit produces identical archive bytes: sorted regular files, fixed ownership/modes/timestamps, no gzip timestamp. The allowlist includes source, public assets, tests, deployment templates, documentation and package metadata. Untracked/dirty files, `.git`, dependencies and runtime data are excluded. Git symlinks/submodules in selected paths are refused.

SHA-256 detects corruption/substitution against the independently recorded value; it is **not a publisher signature**. Review/trust the source revision and the Python updater before executing them as administrator. A public repository or a passing CI result is not release approval.

```sh
python3 scripts/release.py verify /tmp/agentd-release.tar.gz --sha256 RECORDED_SHA256 --extract /tmp/agentd-release
```

Extraction requires a new directory, rejects duplicate paths, traversal, links, unexpected members, incomplete files and overlarge archives. The manifest binds each file, package version, task schema and Git revision.

## Installation configuration

Copy `deploy/update.example.json` to a root-owned, mode-600 file outside the checkout. Set the existing application/state paths, service account, unit names, node/npm paths, loopback health URL and control socket. List all separate configuration files in `configFiles` (including any independently configured mobile JSON). Unit files, drop-ins and systemd EnvironmentFiles are discovered automatically. Configuration values and the effective Environment are hashed, never printed.

The first managed update needs `--adopt-existing`: this explicitly records the existing configuration after enforcing the supported service security floor. Subsequent updates compare it with the recorded baseline and stop on drift. They never replace units or configuration with release templates. An intentional configuration change needs administrator review and reconciliation of the baseline; do not bypass a drift failure by deleting the record without review.

```sh
sudo python3 /tmp/agentd-release/scripts/update.py plan \
  --config /etc/agentd/update.json --archive /tmp/agentd-release.tar.gz \
  --sha256 RECORDED_SHA256 --adopt-existing
sudo python3 /tmp/agentd-release/scripts/update.py install \
  --config /etc/agentd/update.json --archive /tmp/agentd-release.tar.gz \
  --sha256 RECORDED_SHA256 --adopt-existing
```

The plan verifies compatibility and configuration without changing services/application/state; it creates a private management directory/lock if needed. The install downloads locked npm development dependencies with lifecycle scripts disabled, then runs typecheck and the mandatory Linux isolation suite under an unprivileged service boundary in a disposable profile. It does not skip tests to accommodate an incompatible host. Candidate tests cannot access the configured state parent, service home, control-socket directory or listed configuration files. No account/native-model acceptance test runs during this update.

The updater verifies files again, excludes concurrent updates, refuses active tasks/account changes, stops the gateway, rechecks idleness, stops the runner and backs up state. It swaps the application, verifies the reported release **and task-schema version**, then starts the gateway. Application files become root-owned; native credential profiles and the renewal journal outside task state are untouched. Project Git checkouts are deliberately not advanced by an application update; import/pull and review remain separate.

## Database compatibility

`tasks.sqlite` now uses `PRAGMA user_version=1`. Historical unversioned layouts (version 0) migrate in one transaction, including legacy project/conversation ancestry and startup recovery. Invalid ancestry, schema validation or recovery failure rolls back schema/data/version together. Versioned schemas are validated and never silently repaired. A future version is refused before task recovery or worker-directory cleanup. Health retains metadata `schemaVersion: 1` and separately reports `taskSchemaVersion` (null with no runner).

This is forward migration only. Older releases predating version checks cannot be trusted to reject a newer task database. Always restore **the prior application and its matching state backup together** when downgrading. Never revert native credential profiles or renewal journals: the provider may already have rotated those credentials.

## Failure and recovery

An ordinary swap/start/readiness failure restores the previous application and matching state, preserving file ownership, then restarts the old services. Private backups are next to the application; their location is printed locally. They contain sensitive task data and are root-accessible only. Disk-capacity planning and backup retention remain administrator responsibilities.

`pending.json` in the private deployment directory intentionally blocks further updates after a failed or abruptly interrupted install. Do not rerun blindly. Inspect service status and the recorded backup locally. If the application swap occurred, stop both services, preserve the failed application/state, restore `backup/app` and `backup/state` **with ownership**, and restart. If no swap occurred, preserve the current application/state and restart stopped services. Verify health and review `installed.json`; remove `pending.json` only after recovery is complete. A power failure is not claimed to have automatic rollback. Filesystem changes and service management are not one atomic transaction.

The GUI has no sudo or update endpoint. A future narrowly scoped management service, signed release provenance, automatic crash recovery, full native-version attestations, disk budgets and managed baseline reconciliation remain backlog items.

## Gateway identity profile

Version 0.22 introduces an explicit, separately journalled [gateway transition](gateway-boundary.md). Ordinary updates still never change accounts or units. After migration, the update configuration includes `gatewayUser` and `gatewaySocket`, and `configFiles` includes the separate gateway JSON and TLS files. A pending `gateway-pending.json` blocks ordinary updates just like an application transaction marker. The old profile's fingerprint format remains unchanged so the migration starts from the existing reviewed baseline, without re-adoption.
