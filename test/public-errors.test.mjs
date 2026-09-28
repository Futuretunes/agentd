import { test } from "node:test";
import assert from "node:assert/strict";
import {
  publicError,
  browserResult,
  unknownError,
} from "../src/public-errors.ts";
import { publicMessages } from "../src/public-error-messages.ts";
test("browser error boundary preserves fixed guidance but drops paths, subprocess output and arbitrary values", () => {
  assert.equal(publicError(Error("Task not found")), "Task not found");
  assert.equal(
    publicError(
      Object.assign(Error("ENOENT: /private/server/credentials.json"), {
        code: "ENOENT",
      }),
    ),
    "A required file is unavailable. Refresh the project and retry.",
  );
  for (const value of [
    Error("fatal: bad revision /private/repo\nsecret stdout"),
    Error("private@example.invalid"),
    Error("Task not found\nprivate output"),
    { message: "Task not found" },
    null,
  ])
    assert.equal(publicError(value), unknownError);
  assert.equal(publicError("Exit 1"), "Exit 1");
  for (const value of publicMessages) {
    assert.ok(value.length <= 350);
    assert.ok(!value.includes("\n"));
    assert.ok(!value.includes("/"));
  }
});
test("stored task and nested check errors are normalized without altering authored content or exposing checks payloads", () => {
  const input = {
    task: {
      error: "/private/root",
      settings_error: "unexpected private token",
      checks: JSON.stringify({
        status: "failed",
        error: "/private/check",
        exitCode: 1,
      }),
    },
    jobs: [{ error: "Task not found" }],
    prompt: "literal user text",
    output: "explicit log contents",
    answer: "literal answer",
  };
  const value = browserResult(input);
  assert.equal(value.task.error, unknownError);
  assert.equal(value.task.settings_error, unknownError);
  assert.equal(JSON.parse(value.task.checks).error, unknownError);
  assert.equal(value.jobs[0].error, "Task not found");
  assert.equal(value.output, input.output);
  assert.equal(value.prompt, input.prompt);
  assert.equal(input.task.error, "/private/root");
  assert.equal(
    browserResult({ checks: "invalid private content" }).checks,
    null,
  );
});
