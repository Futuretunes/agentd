import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { handleAdminRequest, startRollback, startUpdate } from "../src/admin-helper.ts";

test("approved-release job, approval and listing preserve update safeguards", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./in_app_updates.py", import.meta.url))],
    {
      stdio: "pipe",
    },
  );
});

test("administration helper starts only a fixed unit for an approved, newer release", () => {
  const listing = (overrides = {}) => ({
    format: 1,
    running: false,
    configuration: "ok",
    candidates: [
      { version: "0.63.0", valid: true, newer: true },
      { version: "0.62.3", valid: true, newer: false },
      { version: "0.64.0", valid: false, newer: false },
    ],
    ...overrides,
  });
  const started = [];
  const start = (unit) => started.push(unit);
  assert.deepEqual(
    startUpdate("0.63.0", () => listing(), start),
    {
      started: true,
      version: "0.63.0",
    },
  );
  assert.deepEqual(started, ["agentd-update@0.63.0.service"]);
  for (const bad of ["0.63", "../0.63.0", "0.63.0;id", "0.63.0 ", 63])
    assert.throws(() => startUpdate(bad, () => listing(), start), /Invalid update/);
  assert.throws(() => startUpdate("0.62.3", () => listing(), start), /not installable/);
  assert.throws(() => startUpdate("0.64.0", () => listing(), start), /not installable/);
  assert.throws(() => startUpdate("0.65.0", () => listing(), start), /not installable/);
  assert.throws(
    () => startUpdate("0.63.0", () => listing({ running: true }), start),
    /already running/,
  );
  assert.throws(
    () => startUpdate("0.63.0", () => listing({ configuration: "drift" }), start),
    /Configuration/,
  );
  assert.equal(started.length, 1);
  const config = {
    mobileConfig: "/nonexistent",
    updates: () => listing(),
    startUnit: start,
  };
  assert.equal(handleAdminRequest({ op: "updates" }, config).format, 1);
  assert.throws(() => handleAdminRequest({ op: "updates", extra: 1 }, config));
  assert.throws(() =>
    handleAdminRequest(
      { op: "update-start", version: "0.63.0", archive: "/tmp/x" },
      config,
    ),
  );
  assert.equal(
    handleAdminRequest({ op: "update-start", version: "0.63.0" }, config).started,
    true,
  );
});

test("in-app rollback restores the previous version and data or puts back what was running", () => {
  execFileSync(
    "python3",
    ["-B", fileURLToPath(new URL("./in_app_rollback.py", import.meta.url))],
    {
      stdio: "pipe",
    },
  );
});

test("administration helper starts rollback only for the offered target", () => {
  const listing = (overrides = {}) => ({
    format: 1,
    running: false,
    configuration: "ok",
    candidates: [],
    rollback: { available: true, version: "0.63.0" },
    ...overrides,
  });
  const started = [];
  const start = (unit) => started.push(unit);
  assert.deepEqual(
    startRollback("0.63.0", () => listing(), start),
    {
      started: true,
      version: "0.63.0",
    },
  );
  assert.deepEqual(started, ["agentd-rollback@0.63.0.service"]);
  assert.throws(() => startRollback("0.62.3", () => listing(), start), /not available/);
  assert.throws(
    () =>
      startRollback("0.63.0", () => listing({ rollback: { available: false } }), start),
    /not available/,
  );
  assert.throws(
    () => startRollback("0.63.0", () => listing({ running: true }), start),
    /running/,
  );
  assert.throws(
    () => startRollback("0.63.0", () => listing({ configuration: "drift" }), start),
    /Configuration/,
  );
  for (const bad of ["0.63", "../0.63.0", 63])
    assert.throws(() => startRollback(bad, () => listing(), start));
  assert.equal(started.length, 1);
  const config = {
    mobileConfig: "/nonexistent",
    updates: () => listing(),
    startUnit: start,
  };
  assert.throws(() =>
    handleAdminRequest({ op: "rollback-start", version: "0.63.0", path: "/opt" }, config),
  );
  assert.equal(
    handleAdminRequest({ op: "rollback-start", version: "0.63.0" }, config).started,
    true,
  );
});
