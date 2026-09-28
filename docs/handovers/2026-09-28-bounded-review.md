# 2026-09-28 — Bounded oversized reviews

- Author: Codex; overnight backlog R15.
- Branch: `fix/bounded-review-output` from `feat/sensitive-data-review` at `06970f4`.
- Release: cumulative 0.27.0, task schema 1. Not installed; production remains 0.22.0.

## Change

Shared Git execution converts ENOBUFS to `GitOutputLimitError`, discarding captured stdout/stderr. Review caps patch generation at 180,000 bytes and returns an empty patch with `truncated: true` on overflow. Metadata overflow similarly yields an unapprovable bounded response. Existing revision/commit gates refuse truncated reviews. Files and a capped 100-file stat remain where available. The GUI now describes sensitive content/binary/scan findings as changes requiring separate review, not only sensitive filenames.

The real large-diff regression also exposed that `diff.external=` tries to execute an empty command on plain Git diff. Removed that override: custom diff commands are already refused by configuration checks, inherited overrides are excluded and review diff explicitly disables external diff/textconv. No external execution was enabled.

## Validation

Focused large-review and Git-policy tests passed 3/3, including a real diff exceeding the former 4 MiB buffer with blob contents still within the scan budget. The new result is bounded and unapprovable, without raw subprocess output. Full exact Linux/CI pending. No deployment/model/account/publication operation.

## Next and deployment

Continue R19 missing audit entries and browser-session attribution. Prepare one cumulative managed source release and resource profile migration after final checks. No new migration for R15. Huge/binary changes still need separate review; this does not implement a paginated large-file editor. Managed rollback remains unchanged.
