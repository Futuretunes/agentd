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
import { execFileSync } from "node:child_process";

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
    // The helper runs with umask 077; restore the original mode explicitly so the
    // gateway group can still read its configuration after a rotation.
    chmodSync(temporary, info.mode & 0o777);
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

export function diagnostics(command = "/opt/agentd/scripts/admin_diagnostics.py") {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 32768,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (value?.format !== 1 || value.error) throw Error("Diagnostics unavailable");
  return value;
}

function runScript(command: string) {
  return execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 32768,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
}

export function updates(command = "/opt/agentd/scripts/admin_updates.py") {
  const value = JSON.parse(runScript(command));
  if (value?.format !== 1 || value.error) throw Error("Updates unavailable");
  return value;
}

const releaseVersion = /^[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}$/;
// Only a validated version reaches systemd. The job unit re-verifies the approval,
// archive digest and version order before running the managed updater.
export function startUpdate(
  version: unknown,
  list: () => any = updates,
  start: (unit: string) => void = (unit) => {
    execFileSync("/usr/bin/systemctl", ["start", "--no-block", unit], {
      timeout: 10000,
      stdio: "ignore",
      env: { PATH: "/usr/bin:/bin", LANG: "C" },
    });
  },
) {
  if (typeof version !== "string" || !releaseVersion.test(version))
    throw Error("Invalid update request");
  const value = list();
  if (value.running) throw Error("An update is already running");
  if (value.configuration !== "ok") throw Error("Configuration needs review first");
  const candidate = value.candidates?.find((item: any) => item.version === version);
  if (!candidate?.valid || !candidate.newer) throw Error("Release is not installable");
  start(`agentd-update@${version}.service`);
  return { started: true as const, version };
}

export function handleAdminRequest(
  input: any,
  config: {
    mobileConfig: string;
    diagnostics?: () => unknown;
    updates?: () => unknown;
    startUnit?: (unit: string) => void;
  },
) {
  if (input?.op === "rotate-access-key") {
    if (Object.keys(input).sort().join(" ") !== "currentKey newHash op")
      throw Error("Unsupported admin operation");
    rotateAccessFile(config.mobileConfig, input.currentKey, input.newHash);
    return { rotated: true };
  }
  if (input?.op === "diagnostics" && Object.keys(input).join(" ") === "op")
    return (config.diagnostics ?? diagnostics)();
  if (input?.op === "updates" && Object.keys(input).join(" ") === "op")
    return (config.updates ?? updates)();
  if (input?.op === "update-start") {
    if (Object.keys(input).sort().join(" ") !== "op version")
      throw Error("Unsupported admin operation");
    return startUpdate(input.version, config.updates ?? updates, config.startUnit);
  }
  throw Error("Unsupported admin operation");
}

export function adminHelper(config: {
  socket: string;
  mobileConfig: string;
  diagnostics?: () => unknown;
}) {
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
        const result = handleAdminRequest(input, config);
        connection.end(JSON.stringify({ ok: true, result }) + "\n");
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
