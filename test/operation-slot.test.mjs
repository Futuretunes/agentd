import { test } from "node:test";
import assert from "node:assert/strict";
import { operationSlot } from "../src/operation-slot.ts";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
test("cancellation retains operation ownership until cleanup settles and stale IDs cannot cancel a successor", async () => {
  const slot = operationSlot("dependencies"),
    cleanup = deferred();
  let signal;
  const first = slot.start("first", async (s) => {
    signal = s;
    await cleanup.promise;
  });
  assert.deepEqual(slot.view(), { kind: "dependencies", id: "first" });
  assert.equal(Object.isFrozen(slot.view()), true);
  await Promise.resolve();
  assert.equal(slot.cancel("wrong"), false);
  assert.equal(signal.aborted, false);
  assert.equal(slot.cancel("first"), true);
  assert.equal(signal.aborted, true);
  assert.equal(slot.busy(), true);
  assert.throws(() => slot.start("second", async () => {}), /in progress/);
  cleanup.resolve();
  await first;
  assert.equal(slot.busy(), false);
  const next = deferred();
  let nextSignal;
  const second = slot.start("second", async (s) => {
    nextSignal = s;
    await next.promise;
  });
  await Promise.resolve();
  assert.equal(slot.cancel("first"), false);
  assert.equal(nextSignal.aborted, false);
  next.resolve();
  await second;
  await slot.close();
});
test("completion cannot clear a successor started by the settled callback; failures release ownership", async () => {
  const slot = operationSlot("dependencies"),
    cleanup = deferred();
  let second;
  const first = slot.start(
    "first",
    async () => {},
    () => {
      second = slot.start("second", async () => cleanup.promise);
    },
  );
  await first;
  assert.equal(slot.view().id, "second");
  cleanup.resolve();
  await second;
  const failed = slot.start("failed", async () => {
    throw Error("fixture failure");
  });
  await assert.rejects(failed, /fixture failure/);
  assert.equal(slot.busy(), false);
  await slot.close();
});
test("shutdown aborts and waits for cleanup, refuses new work, and handles cancellation before execution", async () => {
  const slot = operationSlot("dependencies"),
    cleanup = deferred();
  let aborted = false,
    closed = false;
  slot.start("first", async (signal) => {
    aborted = signal.aborted;
    await cleanup.promise;
  });
  const closing = slot.close().then(() => {
    closed = true;
  });
  await Promise.resolve();
  assert.equal(aborted, true);
  assert.equal(closed, false);
  assert.throws(() => slot.assertAvailable(), /stopping/);
  cleanup.resolve();
  await closing;
  assert.equal(closed, true);
  assert.equal(slot.busy(), false);
  assert.throws(() => slot.start("next", async () => {}), /stopping/);
});
