import test from "node:test";
import assert from "node:assert/strict";
import {
  managedOperationOperations,
  requestRouter,
  reviewPreparationOperations,
  serviceReadOperations,
} from "../src/request-routing.ts";

test("request routing assigns review preparation operations to one domain", () => {
  const seen = [];
  const route = requestRouter(
    [
      {
        name: "review-preparation",
        operations: reviewPreparationOperations,
        handle: (input) => seen.push(["review", input.op]),
      },
    ],
    (input) => seen.push(["core", input?.op]),
  );
  for (const op of reviewPreparationOperations) route({ op });
  route({ op: "show" });
  assert.deepEqual(seen, [
    ...reviewPreparationOperations.map((op) => ["review", op]),
    ["core", "show"],
  ]);
});

test("request routing assigns extracted managers without overlapping preparation", () => {
  const seen = [];
  const route = requestRouter(
    [
      {
        name: "review-preparation",
        operations: reviewPreparationOperations,
        handle: (input) => seen.push(["review", input.op]),
      },
      {
        name: "managed-operations",
        operations: managedOperationOperations,
        handle: (input) => seen.push(["managed", input.op]),
      },
    ],
    (input) => seen.push(["core", input?.op]),
  );
  for (const op of managedOperationOperations) route({ op });
  assert.deepEqual(
    seen,
    managedOperationOperations.map((op) => ["managed", op]),
  );
});

test("request routing keeps service reads independent from mutation domains", () => {
  const seen = [];
  const route = requestRouter(
    [
      { name: "managed", operations: managedOperationOperations, handle() {} },
      {
        name: "service-reads",
        operations: serviceReadOperations,
        handle: (input) => seen.push(input.op),
      },
    ],
    () => {},
  );
  for (const op of serviceReadOperations) route({ op });
  assert.deepEqual(seen, serviceReadOperations);
});

test("request routing rejects duplicate ownership at startup", () => {
  assert.throws(
    () =>
      requestRouter(
        [
          { name: "first", operations: ["show"], handle() {} },
          { name: "second", operations: ["show"], handle() {} },
        ],
        () => {},
      ),
    /Duplicate request operation: show/,
  );
});

test("malformed and unowned requests stay on the core validation path", () => {
  const values = [];
  const route = requestRouter([], (input) => values.push(input));
  route(null);
  route({});
  route({ op: 7 });
  assert.deepEqual(values, [null, {}, { op: 7 }]);
});
