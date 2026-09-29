import test from "node:test";
import assert from "node:assert/strict";
import { requestRouter, reviewPreparationOperations } from "../src/request-routing.ts";

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
