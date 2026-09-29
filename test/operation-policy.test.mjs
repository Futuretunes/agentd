import { test } from "node:test";
import assert from "node:assert/strict";
import { admissionBlocked } from "../src/operation-policy.ts";
// Independent reference expressions taken from the pre-extraction runner.
// Keep them explicit: testing against the production table itself is not evidence.
const original = {
  repository: (s) => s.repository || s.publication || s.dependency || s.github,
  publication: (s) => s.publication || s.repository || s.dependency || s.github,
  dependencies: (s) =>
    s.dependency ||
    s.repository ||
    s.publication ||
    s.worker ||
    s.account ||
    s.preparing ||
    s.queued,
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
    s.reviewPreparation,
  models: (s) =>
    s.worker || s.preparing || s.account || s.probes || s.dependency || s.models,
  githubChange: (s) => s.repository || s.publication,
  accountChange: (s) =>
    s.worker || s.dependency || s.preparing || s.renewal || s.probes || s.queued,
  checks: (s) => s.account || s.dependency,
  review: (s) => s.worker || s.queued,
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
