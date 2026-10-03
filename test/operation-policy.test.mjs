import { test } from "node:test";
import assert from "node:assert/strict";
import { admissionBlocked } from "../src/operation-policy.ts";
// Independent reference expressions taken from the pre-extraction runner, plus the
// local-folder import added later. Keep them explicit: testing against the
// production table itself is not evidence.
const original = {
  repository: (s) =>
    s.repository || s.publication || s.dependency || s.github || s.localFolder,
  publication: (s) =>
    s.publication || s.repository || s.dependency || s.github || s.localFolder,
  dependencies: (s) =>
    s.dependency ||
    s.repository ||
    s.publication ||
    s.worker ||
    s.account ||
    s.preparing ||
    s.queued ||
    s.localFolder,
  feedback: (s) =>
    s.publication ||
    s.repository ||
    s.dependency ||
    s.worker ||
    s.account ||
    s.github ||
    s.queued,
  accountProbe: (s) => s.probes || s.closing || s.worker || s.models || s.account,
  dispatch: (s) =>
    s.closing || s.worker || s.dependency || s.models || s.account || s.renewalProbe,
  storage: (s) =>
    s.worker ||
    s.preparing ||
    s.account ||
    s.dependency ||
    s.repository ||
    s.publication ||
    s.models ||
    s.unsettled ||
    s.reviewPreparation ||
    s.localFolder,
  models: (s) =>
    s.worker || s.preparing || s.account || s.probes || s.dependency || s.models,
  githubChange: (s) => s.repository || s.publication,
  accountChange: (s) =>
    s.worker || s.dependency || s.preparing || s.renewal || s.probes || s.queued,
  checks: (s) => s.account || s.dependency,
  review: (s) => s.worker || s.queued,
  localFolder: (s) =>
    s.closing ||
    s.localFolder ||
    s.repository ||
    s.publication ||
    s.dependency ||
    s.github ||
    s.worker ||
    s.preparing ||
    s.queued,
  update: (s) =>
    s.closing ||
    s.worker ||
    s.queued ||
    s.unsettled ||
    s.preparing ||
    s.account ||
    s.renewal ||
    s.probes ||
    s.dependency ||
    s.repository ||
    s.publication ||
    s.github ||
    s.models ||
    s.reviewPreparation ||
    s.localFolder,
};
const states = [
  "repository",
  "publication",
  "dependency",
  "github",
  "worker",
  "account",
  "preparing",
  "queued",
  "probes",
  "closing",
  "models",
  "renewalProbe",
  "unsettled",
  "reviewPreparation",
  "renewal",
  "localFolder",
];
test("extracted admission decisions preserve all legacy state combinations", () => {
  for (let mask = 0; mask < 2 ** states.length; mask++) {
    const state = Object.fromEntries(states.map((key, i) => [key, !!(mask & (1 << i))]));
    for (const [operation, expected] of Object.entries(original)) {
      const actual = admissionBlocked(operation, (key) => state[key]);
      if (actual !== expected(state))
        assert.fail(`${operation} diverged at state mask ${mask}`);
    }
  }
});
test("admission reads only relevant blockers and retains intentional directionality", () => {
  const reads = [];
  assert.equal(
    admissionBlocked("dispatch", (state) => {
      reads.push(state);
      return state === "worker";
    }),
    true,
  );
  assert.deepEqual(reads, ["closing", "worker"]);
  // Background publication and an existing worker were not global exclusions.
  assert.equal(
    admissionBlocked("publication", (state) => state === "worker"),
    false,
  );
  assert.equal(
    admissionBlocked("feedback", (state) => state === "worker"),
    true,
  );
  assert.equal(
    admissionBlocked("dispatch", (state) => state === "publication"),
    false,
  );
  assert.equal(
    admissionBlocked("githubChange", (state) => state === "publication"),
    true,
  );
  assert.equal(
    admissionBlocked("dispatch", (state) => state === "renewalProbe"),
    true,
  );
  assert.equal(
    admissionBlocked("dispatch", (state) => state === "probes"),
    false,
  );
});
test("local-folder import conflicts in both directions with repository-changing work", () => {
  for (const other of ["repository", "publication", "dependency", "worker", "queued"])
    assert.equal(
      admissionBlocked("localFolder", (s) => s === other),
      true,
      other,
    );
  for (const operation of [
    "repository",
    "publication",
    "dependencies",
    "storage",
    "update",
  ])
    assert.equal(
      admissionBlocked(operation, (s) => s === "localFolder"),
      true,
      operation,
    );
  // Model probes and account checks do not touch folders.
  assert.equal(
    admissionBlocked("localFolder", (s) => s === "probes"),
    false,
  );
  assert.equal(
    admissionBlocked("dispatch", (s) => s === "localFolder"),
    false,
  );
});
