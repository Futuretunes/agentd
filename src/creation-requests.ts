import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
const canonical = (value: any): any =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((key) => value[key] !== undefined)
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export type Receipt = {
  scope: string;
  requestId: string;
  operation: string;
  payloadHash: string;
  resultId: string | null;
};
export function creationRequests(db: DatabaseSync) {
  function inspect(input: any, scope: string): Receipt | undefined {
    if (
      !["create", "project-create"].includes(input.op) ||
      input.requestId === undefined
    )
      return;
    if (
      typeof input.requestId !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        input.requestId,
      )
    )
      throw Error("Invalid creation request identifier");
    const payload =
      input.op === "project-create"
        ? { op: input.op, name: input.name }
        : {
            op: input.op,
            project: input.project ?? "default",
            conversation: input.conversation ?? null,
            parent: input.parent ?? null,
            adapter: input.adapter,
            mode: input.mode ?? "ask",
            prompt: input.prompt,
            attachments: input.attachments ?? [],
            overrides: input.overrides ?? {},
          };
    const payloadHash = createHash("sha256")
        .update(JSON.stringify(canonical(payload)))
        .digest("hex"),
      requestId = input.requestId.toLowerCase();
    const prior = db
      .prepare(
        "SELECT operation,payload_hash,result_id FROM creation_requests WHERE scope=? AND request_id=?",
      )
      .get(scope, requestId);
    if (
      prior &&
      (prior.operation !== input.op || prior.payload_hash !== payloadHash)
    )
      throw Error(
        "This request identifier was already used for different work. Review the earlier result before starting a new request.",
      );
    return {
      scope,
      requestId,
      operation: input.op,
      payloadHash,
      resultId: prior ? String(prior.result_id) : null,
    };
  }
  function save(receipt: Receipt | undefined, resultId: string) {
    if (!receipt) return;
    if (!db.isTransaction)
      throw Error("Creation receipt requires a transaction");
    db.prepare(
      "INSERT INTO creation_requests(scope,request_id,operation,payload_hash,result_id,created) VALUES(?,?,?,?,?,?)",
    ).run(
      receipt.scope,
      receipt.requestId,
      receipt.operation,
      receipt.payloadHash,
      resultId,
      new Date().toISOString(),
    );
  }
  return { inspect, save };
}
