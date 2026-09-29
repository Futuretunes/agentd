# Managed release updates

Candidate 0.21.0 introduces a tracked source-release builder and administrator-only updater. This replaces per-feature update logic; fresh account/TLS/native-CLI provisioning still follows [deployment](deployment.md). It does not merge Git branches, change the project checkout, install native CLIs, relax host protections, reconnect accounts or submit model tasks.

## Build and review

From a reviewed checkout, use the **full commit SHA**, not a moving branch name:

```sh
python3 -B scripts/release.py build --revision FULL_COMMIT_SHA --output /tmp/agentd-release.tar.gz
```

Record the printed SHA-256 separately. Same commit produces identical archive bytes: sorted regular files, fixed ownership/modes/timestamps, no gzip timestamp. The allowlist includes source, public assets, tests, deployment templates, documentation and package metadata. Untracked/dirty files, `.git`, dependencies and runtime data are excluded. Git symlinks/submodules in selected paths are refused.

SHA-256 detects corruption/substitution against the independently recorded value; it is **not a publisher signature**. Review/trust the source revision and the Python updater before executing them as administrator. A public repository or a passing CI result is not release approval.

```sh
python3 -B scripts/release.py verify /tmp/agentd-release.tar.gz --sha256 RECORDED_SHA256 --extract /tmp/agentd-release
```

Extraction requires a new directory, rejects duplicate paths, traversal, links, unexpected members, incomplete files and overlarge archives. The manifest binds each file, package version, task schema and Git revision.

## Installation configuration

Copy `deploy/update.example.json` to a root-owned, mode-600 file outside the checkout. Set the existing application/state paths, service account, unit names, node/npm paths, loopback health URL and control socket. List all separate configuration files in `configFiles` (including any independently configured mobile JSON). Unit files, drop-ins and systemd EnvironmentFiles are discovered automatically. Configuration values and the effective Environment are hashed, never printed.

The first managed update needs `--adopt-existing`: this explicitly records the existing configuration after enforcing the supported service security floor. Subsequent updates compare it with the recorded baseline and stop on drift. They never replace units or configuration with release templates. An intentional configuration change needs administrator review and reconciliation of the baseline; do not bypass a drift failure by deleting the record without review.

```sh
sudo python3 -B /tmp/agentd-release/scripts/update.py plan \
  --config /etc/agentd/update.json --archive /tmp/agentd-release.tar.gz \
  --sha256 RECORDED_SHA256 --adopt-existing
sudo python3 -B /tmp/agentd-release/scripts/update.py install \
  --config /etc/agentd/update.json --archive /tmp/agentd-release.tar.gz \
  --sha256 RECORDED_SHA256 --adopt-existing
```

The plan verifies compatibility and configuration without changing services/application/state; it creates a private management directory/lock if needed. The install downloads locked npm development dependencies with lifecycle scripts disabled, then runs typecheck and the mandatory Linux isolation suite under an unprivileged service boundary in a disposable profile. It does not skip tests to accommodate an incompatible host. Candidate tests cannot access the configured state parent, service home, control-socket directory or listed configuration files. No account/native-model acceptance test runs during this update.

The updater verifies files again, excludes concurrent updates, refuses active tasks/account changes, stops the gateway, rechecks idleness, stops the runner and backs up state. It swaps the application, verifies the reported release **and task-schema version**, then starts the gateway. Application files become root-owned; native credential profiles and the renewal journal outside task state are untouched. Project Git checkouts are deliberately not advanced by an application update; import/pull and review remain separate.

## Configuration fingerprints and reconciliation

Tracked configuration files are fingerprinted by content, owner, group and mode (format v2, since 0.62.2). A permission change is drift, like a content change. The value of `accessHash` is masked while it is a valid 64-character digest, so a supported access-key rotation from Settings is not drift. Any other edit, or an invalid digest, still is.

Always run the scripts with `python3 -B`: root must not write `__pycache__` into the application or staging directories.

After a reviewed, explained change to a tracked configuration file (or once when moving from v1 to v2 fingerprints), re-record the baseline with `scripts/reconcile_configuration.py`. It:

- refuses unit, drop-in and service-property differences;
- accepts files whose bytes still match the recorded digest;
- requires every file whose content changed to be named with `--accept`;
- plans by default, and keeps the previous baseline as `installed.json.<time>.bak` when run with `--apply`.

```sh
sudo python3 -B /tmp/agentd-release/scripts/reconcile_configuration.py --config /etc/agentd/update.json
sudo python3 -B /tmp/agentd-release/scripts/reconcile_configuration.py --config /etc/agentd/update.json --accept /etc/agentd-web/mobile.json --apply
```

## Database compatibility

`tasks.sqlite` uses `PRAGMA user_version=2` from release 0.32. Historical unversioned layouts (version 0) and the verified version-1 baseline migrate in one transaction, including legacy project/conversation ancestry, durable creation receipts and startup recovery. Invalid ancestry, schema validation or recovery failure rolls back schema/data/version together. Versioned schemas are validated and never silently repaired. A future version is refused before task recovery or worker-directory cleanup. Releases supporting only schema 1 refuse a schema-2 database; rollback requires the matching pre-update application and task-state backup, never merely replacing the code. Health retains metadata `schemaVersion: 1` and separately reports `taskSchemaVersion` (null with no runner).

This is forward migration only. Older releases predating version checks cannot be trusted to reject a newer task database. Always restore **the prior application and its matching state backup together** when downgrading. Never revert native credential profiles or renewal journals: the provider may already have rotated those credentials.

## Failure and recovery

An ordinary swap/start/readiness failure restores the previous application and matching state, preserving file ownership, then restarts the old services. Private backups are next to the application; their location is printed locally. They contain sensitive task data and are root-accessible only. Disk-capacity planning and backup retention remain administrator responsibilities.

`pending.json` in the private deployment directory intentionally blocks further updates after a failed or abruptly interrupted install. Do not rerun blindly. Inspect service status and the recorded backup locally. If the application swap occurred, stop both services, preserve the failed application/state, restore `backup/app` and `backup/state` **with ownership**, and restart. If no swap occurred, preserve the current application/state and restart stopped services. Verify health and review `installed.json`; remove `pending.json` only after recovery is complete. A power failure is not claimed to have automatic rollback. Filesystem changes and service management are not one atomic transaction.

The GUI has no sudo or update endpoint. A future narrowly scoped management service, signed release provenance, automatic crash recovery, full native-version attestations, disk budgets and managed baseline reconciliation remain backlog items.

## Gateway identity profile

Version 0.22 introduces an explicit, separately journalled [gateway transition](gateway-boundary.md). Ordinary updates still never change accounts or units. After migration, the update configuration includes `gatewayUser` and `gatewaySocket`, and `configFiles` includes the separate gateway JSON and TLS files. A pending `gateway-pending.json` blocks ordinary updates just like an application transaction marker. The old profile's fingerprint format remains unchanged so the migration starts from the existing reviewed baseline, without re-adoption.

## Resource profile and backup retention

Version 0.23 adds `resourceProfile: standard-v1` through the explicit `scripts/apply_resources.py` transition. The updater preserves the existing fingerprint format until that transition is recorded. `resources-pending.json` blocks ordinary updates after an interrupted transition. Restore only its dedicated resource drop-ins and backed-up update configuration/record during manual recovery; never restore native credential profiles.

Successful newly marked application backups retain at least three copies and 30 days; pins, failed/legacy backups and configuration backups are excluded from automatic removal. Prospective backup size and free-space reserve are checked before installation. See [resource and retention policy](resource-retention.md) for the exact boundaries and administrator preview tool.
