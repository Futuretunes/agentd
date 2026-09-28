/** Runner-enforced browser authority. New admin operations are denied by default. */
import { createServer, type Socket } from "node:net";
import { chmodSync, chownSync, lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";

const fields: Record<string, string> = {
  "storage-preview": "owner",
  "storage-cleanup": "owner fingerprint",
  capabilities: "",
  operations: "",
  projects: "",
  list: "",
  "archived-projects": "",
  "repository-jobs": "",
  history: "query filter before",
  conversations: "project",
  "conversation-show": "id before",
  show: "id",
  review: "id",
  "task-output": "id",
  create:
    "adapter prompt mode attachments parent conversation project overrides",
  retry: "id",
  "restart-settings": "id",
  revise: "id prompt tree overrides",
  approve: "id fingerprint",
  cancel: "id",
  validate: "id tree",
  commit: "id tree message",
  discard: "id",
  "project-create": "name",
  "project-rename": "id name",
  "project-archive": "id",
  "project-restore": "id",
  "conversation-rename": "id name",
  "conversation-archive": "id",
  "conversation-restore": "id",
  "account-session": "owner",
  "account-start": "owner adapter action",
  "account-code": "owner session code",
  "account-cancel": "owner session",
  "account-refresh": "owner",
  "github-status": "owner",
  "github-start": "owner",
  "github-cancel": "owner session",
  "github-logout": "owner",
  "repository-start": "kind url branch name project",
  "repository-cancel": "job",
  "check-setup": "project task",
  "check-prepare": "project task fingerprint",
  "check-cancel": "id",
  "publication-targets": "task",
  "publication-status": "task",
  "publication-preview": "owner task updateOf base title body",
  "publication-approve": "owner task id fingerprint",
  "feedback-targets": "owner task",
  "feedback-status": "owner task",
  "feedback-prepare": "owner task kind publication base",
  "feedback-apply": "owner task id fingerprint keys instruction",
  "settings-view": "project conversation agent mode prompt overrides owner",
  "settings-save":
    "project conversation agent scope agentScope values previous mode prompt overrides owner",
  "models-refresh": "project conversation agent mode prompt overrides owner",
  "attachment-upload": "name data",
  "attachment-read": "id",
};
export function gatewayRequest(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid gateway request");
  const input = value as Record<string, any>;
  if (typeof input.op !== "string" || !Object.hasOwn(fields, input.op))
    throw Error("Operation is not available through the gateway");
  const allowed = new Set(["op", ...fields[input.op].split(" ")]);
  for (const key of Object.keys(input))
    if (input[key] !== undefined && !allowed.has(key))
      throw Error("Unexpected gateway request field");
  if (
    allowed.has("owner") &&
    (typeof input.owner !== "string" || !/^[a-f0-9]{64}$/.test(input.owner))
  )
    throw Error("Browser owner required");
  if (
    input.op === "approve" &&
    (typeof input.fingerprint !== "string" ||
      !/^[a-f0-9]{64}$/.test(input.fingerprint))
  )
    throw Error("Refresh the run preview before approving.");
  return input;
}

export function gatewaySocket(
  config: { path: string; gid: number },
  dispatch: (input: any) => unknown,
) {
  const dir = dirname(config.path),
    info = lstatSync(dir);
  if (
    !isAbsolute(config.path) ||
    realpathSync(dir) !== dir ||
    !info.isDirectory() ||
    info.uid !== process.getuid?.() ||
    !Number.isSafeInteger(config.gid) ||
    config.gid < 1 ||
    !process.getgroups?.().includes(config.gid)
  )
    throw Error("Invalid gateway socket directory or group");
  // RuntimeDirectory is initially private; only its dedicated child is shared.
  chownSync(dir, info.uid, config.gid);
  chmodSync(dir, 0o750);
  const clients = new Set<Socket>();
  const server = createServer((connection) => {
    if (clients.size >= 16) {
      connection.destroy();
      return;
    }
    clients.add(connection);
    connection.on("close", () => clients.delete(connection));
    connection.on("error", () => {});
    connection.setTimeout(10000, () => connection.destroy());
    const chunks: Buffer[] = [];
    let length = 0;
    connection.on("data", (chunk) => {
      length += chunk.length;
      if (length > 7_500_000) {
        connection.destroy();
        return;
      }
      chunks.push(chunk);
      if (!chunk.includes(10)) return;
      connection.removeAllListeners("data");
      try {
        const bytes = Buffer.concat(chunks),
          end = bytes.indexOf(10);
        if (end !== bytes.length - 1)
          throw Error("One request per connection required");
        const input = gatewayRequest(
          JSON.parse(bytes.subarray(0, end).toString("utf8")),
        );
        if (input.op !== "attachment-upload" && length > 80000)
          throw Error("Request too large");
        connection.end(
          JSON.stringify({ ok: true, result: dispatch(input) }) + "\n",
        );
      } catch (error) {
        connection.end(
          JSON.stringify({ ok: false, error: (error as Error).message }) + "\n",
        );
      }
    });
  });
  server.on("listening", () => {
    chownSync(config.path, info.uid, config.gid);
    chmodSync(config.path, 0o660);
  });
  // Binding errors are deliberately fatal to the service, not a fallback to admin access.
  server.listen(config.path);
  return {
    server,
    async close() {
      for (const client of clients) client.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
