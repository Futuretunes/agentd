import { accessKeyMatches } from "./access-key.ts";
import {
  chmodSync,
  chownSync,
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export function rotateAccessFile(
  path: string,
  currentKey: unknown,
  newHash: unknown,
  expectedUid = 0,
) {
  if (
    !path.startsWith("/") ||
    typeof newHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(newHash)
  )
    throw Error("Invalid rotation request");
  const info = lstatSync(path);
  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size > 65536 ||
    info.uid !== expectedUid
  )
    throw Error("Invalid access configuration");
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(readFileSync(fd, "utf8"));
  } finally {
    closeSync(fd);
  }
  if (!accessKeyMatches(currentKey, String(value.accessHash ?? "")))
    throw Error("Current access key did not match");
  if (newHash === value.accessHash) throw Error("New access key must be different");
  value.accessHash = newHash;
  const temporary = join(dirname(path), `.mobile.json.${process.pid}.tmp`);
  try {
    writeFileSync(temporary, JSON.stringify(value) + "\n", {
      mode: info.mode & 0o777,
      flag: "wx",
    });
    chownSync(temporary, info.uid, info.gid);
    const temporaryFd = openSync(temporary, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      fsyncSync(temporaryFd);
    } finally {
      closeSync(temporaryFd);
    }
    renameSync(temporary, path);
    const directoryFd = openSync(dirname(path), constants.O_RDONLY);
    try {
      fsyncSync(directoryFd);
    } finally {
      closeSync(directoryFd);
    }
  } finally {
    try {
      unlinkSync(temporary);
    } catch {}
  }
  return { rotated: true as const };
}

export function adminHelper(config: { socket: string; mobileConfig: string }) {
  if (process.getuid?.() !== 0) throw Error("Admin helper must run as root");
  const directory = lstatSync(dirname(config.socket));
  if (
    !config.socket.startsWith("/run/agentd-admin/") ||
    !directory.isDirectory() ||
    directory.uid !== 0 ||
    directory.gid < 1
  )
    throw Error("Invalid admin helper configuration");
  const server = createServer((connection) => {
    let data = "";
    connection.setTimeout(5000, () => connection.destroy());
    connection.on("error", () => {});
    connection.on("data", (chunk) => {
      data += chunk;
      if (Buffer.byteLength(data) > 2048) return connection.destroy();
      if (!data.includes("\n")) return;
      connection.removeAllListeners("data");
      try {
        const bytes = Buffer.from(data),
          end = bytes.indexOf(10);
        if (end !== bytes.length - 1) throw Error("One request required");
        const input = JSON.parse(bytes.subarray(0, end).toString("utf8"));
        if (
          input.op !== "rotate-access-key" ||
          Object.keys(input).sort().join(" ") !== "currentKey newHash op"
        )
          throw Error("Unsupported admin operation");
        rotateAccessFile(config.mobileConfig, input.currentKey, input.newHash);
        connection.end('{"ok":true}\n');
      } catch {
        connection.end('{"ok":false}\n');
      }
    });
  });
  server.on("listening", () => {
    chownSync(config.socket, 0, directory.gid);
    chmodSync(config.socket, 0o660);
  });
  server.listen(config.socket);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.umask(0o077);
  const server = adminHelper({
    socket: process.env.AGENTD_ADMIN_SOCKET ?? "/run/agentd-admin/admin.sock",
    mobileConfig: process.env.AGENTD_MOBILE_CONFIG ?? "/etc/agentd-web/mobile.json",
  });
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => server.close(() => process.exit(0)));
}
