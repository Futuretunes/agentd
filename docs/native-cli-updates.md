# Native CLI compatibility and updates

Operations shows the tested release and a normalized installed version, checked alongside account status approximately every five minutes or after Refresh status. A version probe runs only `--version`; it does not submit a prompt or authorize an account. Unrecognized output is unavailable, never displayed raw. A match confirms the version string only, not a full native acceptance test or provider account limits.

`src/native-policy.ts` is the shared source for tested versions and declared fixed limits. Claude has a 16-native-turn cap per run. Codex Chat and Cursor have a 2 MB protocol-output ceiling; Cursor's native prompt response deadline is 15 minutes, while agentd's approved run timeout is at most 10 minutes and normally stops it first. Time/output/worktree/service limits still apply independently. These are application safeguards, not subscription credits. A generic failed exit is not evidence that a particular cap was reached; structured provider termination reasons remain future work.

Changing a CLI independently can break model discovery, requested model/effort selection, credential renewal and pinned wrappers. The service does not silently accept a different version, reconnect accounts, expand tools or download a replacement. Cached version display never bypasses the invocation-time checks. Pending approval fingerprints refresh when the application's declared policy changes; active runs retain their existing snapshot.

## Reviewed update procedure

1. Finish or stop active work. Record the currently tested binary version and retain its rollback artifact privately; never copy account profiles into a release.
2. Stage the proposed official native binary in a disposable profile. Review release notes, flags, authentication/renewal format, advertised tools and protocol changes. Do not test against a live account just to satisfy a checklist.
3. Update the shared pin and relevant adapters, protocol/renewal parsing, fixture transcripts and deployment preflights together. Merely changing the version string is not validation.
4. Run typecheck, all Linux isolation tests without skips, and offline native startup/permission-denial probes. Confirm tools, egress, credential access and filesystem restrictions are unchanged.
5. After explicit operator approval, perform any necessary native account/model acceptance separately. Record what was and was not tested in the shared handover.
6. Schedule the binary/application update while idle with a reviewed rollback plan. The managed application updater deliberately does not install native CLIs. Refresh Operations afterward, then use separately approved smoke work if required.

The update is administrator-managed until a narrowly scoped GUI management service exists. No auto-update or global permission bypass is implied by this procedure.

## In-app Cursor installs (since 0.72.0)

Settings > Agents & CLIs can install **operator-approved** Cursor packages only. An administrator stages a reviewed archive with `scripts/approve_cli.py` into the root-only `/var/lib/agentd-cli` directory. The phone never downloads binaries. Install starts the fixed `agentd-cli-install@cursor_<version>.service` job, which extracts under `/opt/cursor-agent/<version>` and updates the service-user symlink. Claude and Codex remain host-managed npm installs until matching helpers exist.
