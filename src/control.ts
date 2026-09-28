import { createConnection } from "node:net";
const [op, first, ...rest] = process.argv.slice(2);
const input =
  op === "check-setup"
    ? { op, project: first, task: rest[0] }
    : op === "project-checks"
      ? { op, id: first, dependencies: rest[0] }
      : op === "project-register"
        ? { op, name: first, repo: rest[0] }
        : op === "project-create"
          ? { op, name: [first, ...rest].join(" ") }
          : op === "create"
            ? { op, adapter: first, prompt: rest.join(" ") }
            : { op: op ?? "list", id: first };
const socket = createConnection(
  process.env.AGENTD_CONTROL_SOCKET ?? "/run/agentd/control.sock",
);
socket.setTimeout(10000, () => {
  console.error("Control request timed out");
  socket.destroy();
  process.exitCode = 1;
});
socket.on("connect", () => socket.write(JSON.stringify(input) + "\n"));
let data = "";
socket.on("data", (chunk) => {
  data += chunk;
});
socket.on("end", () => {
  try {
    const reply = JSON.parse(data);
    console.log(JSON.stringify(reply.result ?? reply, null, 2));
    if (!reply.ok) process.exitCode = 1;
  } catch {
    console.error("Invalid service response");
    process.exitCode = 1;
  }
});
socket.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
