# Operation admission and compatibility

`src/operation-policy.ts` centralizes the runner's existing global admission checks. This is a **directional start policy**, not an exclusive lock or a claim that all overlapping operations are safe. The extraction deliberately preserves behavior so subsequent changes can be reviewed independently. The runner reads blockers lazily in the listed order.

| Starting operation | Existing states that block this admission check |
| --- | --- |
| Repository discovery/import/update | Repository, publication, dependencies, GitHub sign-in |
| Publication preview/approval | Publication, repository, dependencies, GitHub sign-in |
| Dependency preparation | Dependencies, repository, publication, worker, account busy, preparation, queued task |
| GitHub feedback/integration | Publication, repository, dependencies, worker, account busy, GitHub sign-in, queued task |
| Account status probes | Probes, shutdown, worker, model discovery, account busy |
| Worker dispatch | Shutdown, worker, dependencies, model discovery, account busy, account probes when credential renewal is enabled |
| Storage preview/cleanup | Worker, preparation, account busy, dependencies, repository, publication, model discovery, queued/running/cancelling task, preparing review job |
| Model discovery | Worker, preparation, account busy, probes, dependencies, model discovery |
| GitHub login/logout | Repository, publication |
| Native account login/logout | Worker, dependencies, preparation, renewal, probes, queued task |
| Validation checks | Account busy, dependencies; followed by review availability below |
| Review availability | Worker, queued task |

Definitions:

- **Worker** is the active execution slot, including asynchronous task checkout and validation checks. Its cancellation/completion promise remains owned by the runner.
- **Account busy** combines native account mutation, native credential renewal and pre-dispatch preparation. **Preparation** is the pre-dispatch renewal slot; checkout holds the worker slot.
- **Publication** also covers asynchronous GitHub feedback/integration preparation and approved integration worktree materialization. This shared slot is explicitly preserved, not silently split by this refactor.
- **Account probes** include normalized sign-in/version checks. The conditional dispatch blocker is needed only for installations using credential renewal, matching previous behavior.
- Durable queued/unsettled/review-preparation states come from SQLite; the other states come from live manager/runner slots. They are not reconstructed into a new distributed lock.

## Additional gates remain mandatory

The table does not replace global shutdown refusal, manager-owned account/GitHub/model locks, same-project repository ownership, task/conversation archival state, last-turn checks, exact-content fingerprints, credential exclusions, adapter capability ceilings or human approvals. Native account changes separately refuse model discovery before consulting the table. Repository updates refuse pending work and unresolved reviews in that project. Review/check eligibility still verifies the individual task and repository. Cancellation, status reads and receipt replay do not acquire an exclusive operation slot.

Direction matters. Publication historically can begin during an existing worker; feedback preparation cannot. Dispatch does not globally block on a publication slot. These are **observed preserved behaviors**, not newly approved concurrency permissions. Before tightening or widening a pair, add real interleaving tests, identify the shared repository/credential/state resources and update this table and the independent legacy baseline test deliberately.

## Evidence and remaining work

The extraction is compared with the original Boolean expressions for every combination of 15 busy states (32,768 combinations across 12 admissions), plus focused directionality and lazy-read checks. Existing runner tests exercise actual account exclusion, serial work, cancellation, shutdown, repository, publication, dependency and settings flows. Exhaustive Boolean parity does not prove asynchronous interleavings safe.

R2 still needs explicit owned operation leases and domain decomposition. A future lease must have a kind and identity, release only its own ownership in `finally`, hold ownership until cancellation has reaped descendants, and preserve persistent recovery records across restart. Do not replace this table with a broad global lock without addressing intentional independent-repository work and read/cancel responsiveness. R10 remaining synchronous Git paths should be extracted one domain at a time with these rules visible.

## First owned domain: dependency preparation

`dependency-jobs.ts` owns preview, fingerprint validation, preparation, cancellation, job persistence and its operation slot. `operation-slot.ts` gives this domain one immutable `{kind,id}` identity and a private completion token. Cancellation signals the owner but does not release the slot until preparation and cleanup settle. Shutdown closes admission before aborting/waiting. A stale job ID cannot cancel a successor. The runner still supplies the existing admission policy and project/task accessors, so cross-domain gates are unchanged.

This is the first extracted domain, not a global lease manager. Dependency cancellation before the scheduled callback now records cancellation without invoking the preparation implementation. Unexpected persistence failures are not swallowed. Filesystem preparation plus SQL publication are not yet a single crash-recoverable transaction; a future recovery change must cover that separately.

## Repository operation owner

`repository-jobs.ts` now owns discovery/import/update job execution, persistence, cancellation and cleanup through `operation-slot.ts`. Update ownership still identifies the affected project; unrelated project admission is unchanged. Global repository/GitHub/publication/dependency exclusions use the same directional table. Immediate cancellation is recorded before invoking transport; shutdown waits for transport and partial-import cleanup to settle. Existing registered projects are retained. This extraction does not add automatic retries or make remote Git/filesystem/SQLite changes atomic.

## Publication and check owners

Publication and feedback share `publication-jobs.ts` and one operation slot; shutdown waits for transport settlement and leaves interrupted approved publication marked as needing attention. Integration preview Git and approved worktree materialization also hold that slot through cancellation and cleanup. An interrupted materialization records its deterministic result identity and requires the same browser approval to reconcile and retry; startup never replays it. `check-execution.ts` owns the isolated check process through cleanup and state persistence. It returns a completion handle to the runner's existing shared task/check worker slot. The runner clears only that same handle on completion. A running-state write must succeed before a check process starts. No additional parallel worker capacity is introduced.

## Task execution owner

`task-execution.ts` returns one handle before scheduling checkout. Its identity stays constant as preparation gives way to the child process; cancellation/shutdown sees the same completion promise. The runner retains queue admission, renewal, approval refresh and one task/check slot, clearing only the completing owner. Immediate cancellation is checked before path persistence, checkout or command construction. Checkout cancellation retains partial edits; terminal persistence and sandbox cleanup remain prerequisites for releasing ownership. Unexpected cleanup/persistence exceptions preserve fail-fast behavior; this extraction does not claim complete crash recovery.
