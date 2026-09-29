# 2026-09-28 — Explicit worker sandbox hardening

- Author: Codex.
- Request: continue prioritized backlog overnight after resource/retention work; R7 next.
- Status: implemented and exact-archive/CI verified. Not installed.
- Release: 0.24.0 cumulative candidate, includes 0.23 resources/retention; task schema 1.
- Branch/base: `feat/worker-hardening` from `feat/resource-retention` at `65eee22`.

## Changes

Shared `src/sandbox-policy.ts` drives worker and dependency sandboxes. Explicit user/UTS namespaces, nested-userns refusal/assertion and all-capability drop are required. Cgroup namespace is opportunistic; cgroup limits remain external. `src/sandbox-launch.py` uses Python isolated mode plus libseccomp to pass a generated in-memory filter to bubblewrap. Unknown architectures, missing libraries or rule failures stop launch; no weaker retry exists. The native syscall deny policy includes clone namespace flags, while clone3 returns ENOSYS for ordinary libc fallback. See `docs/worker-hardening.md` for scope and primary references.

The resource profile installer now validates the installed release manifest/capability instead of requiring precisely 0.23.0, allowing the operator's requested cumulative installation. It still requires the exact managed baseline and does not re-adopt configuration. CI explicitly installs libseccomp2.

## Validation

Development Linux copy: 120/120 tests passed, zero skips/failures; 12 focused sandbox/dependency checks also passed. New probe checks zero capabilities, NoNewPrivs/seccomp state, hostname isolation, denied sensitive calls and successful normal threading/forking. Typecheck passed. Exact archive `de1db8a` passed 120/120 Linux tests with zero skips/failures; CI run `36476607174` passed. Archive SHA256: `f07f1faf5d6f0f57670cb00f8721843f4d97592d4359b46991c4d43cd62d858a`. [Draft PR #27](https://github.com/Futuretunes/agentd/pull/27) targets the resource branch. No live model requests, native account changes, root deployment or host protection changes. Installed remains 0.22.0.

## Deployment and rollback

Use a cumulative reviewed archive after the remaining overnight work, then the explicit resource profile migration. No additional root worker-policy migration is needed: the stricter policy is application code. Preserve complete procfs and existing AF_NETLINK. A filter incompatibility fails closed; revert the reviewed application with its matching managed state rather than weakening host policy. No current installation or cleanup occurred.

## Next

Continue R12: consolidate Git subprocess policy to prevent hooks/config/environment divergence. R13 shared sensitive-file policy and bounded content detection follows. Leave R8 GitHub App/consent decisions and R1 baseline decisions to explicit operator review; do not substitute broad credentials or merge main overnight.
