import { createConnection } from "node:net";

function request(socket: string, input: object, timeout = 5000): Promise<unknown> {
  if (!socket.startsWith("/"))
    return Promise.reject(Error("Administration is unavailable."));
  return new Promise((resolve, reject) => {
    const connection = createConnection(socket);
    let response = "";
    connection.setTimeout(timeout, () =>
      connection.destroy(Error("Admin helper timed out")),
    );
    connection.on("connect", () => connection.end(JSON.stringify(input) + "\n"));
    connection.on("data", (chunk) => {
      response += chunk;
      if (Buffer.byteLength(response) > 32768)
        connection.destroy(Error("Admin helper response is too large"));
    });
    connection.on("error", () => reject(Error("Administration is unavailable.")));
    connection.on("end", () => {
      try {
        const value = JSON.parse(response);
        if (!value?.ok) throw Error("Administration request was refused.");
        resolve(value.result ?? { ok: true });
      } catch {
        reject(Error("Administration request was refused."));
      }
    });
  });
}

export async function rotateAccessKey(
  socket: string,
  currentKey: string,
  newHash: string,
): Promise<{ rotated: true }> {
  if (typeof currentKey !== "string" || currentKey.length > 256)
    throw Error("Access-key rotation is unavailable.");
  if (!/^[a-f0-9]{64}$/.test(newHash))
    throw Error("Access-key rotation request is invalid.");
  await request(socket, { op: "rotate-access-key", currentKey, newHash });
  return { rotated: true };
}

export async function readDiagnostics(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "diagnostics" });
  if (
    value?.format !== 1 ||
    typeof value.generatedAt !== "string" ||
    !value.release ||
    !value.configuration ||
    !value.services ||
    !value.storage ||
    !Number.isSafeInteger(value.storage.freeBytes) ||
    !Number.isSafeInteger(value.storage.totalBytes)
  )
    throw Error("Diagnostics response is invalid.");
  return value;
}

export async function readConfiguration(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "configuration" });
  if (
    value?.format !== 1 ||
    typeof value.generatedAt !== "string" ||
    !value.configuration ||
    !value.tls ||
    !value.notes
  )
    throw Error("Configuration response is invalid.");
  return value;
}

const releaseVersion = /^[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}$/;

export async function readUpdates(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "updates" }, 15000);
  if (
    value?.format !== 1 ||
    !value.installed ||
    typeof value.installed.version !== "string" ||
    !["ok", "drift", "reload_required", "recovery_required"].includes(
      value.configuration,
    ) ||
    typeof value.running !== "boolean" ||
    !Array.isArray(value.candidates)
  )
    throw Error("Updates response is invalid.");
  return value;
}

export async function startRollback(
  socket: string,
  version: string,
): Promise<{ started: true; version: string }> {
  if (typeof version !== "string" || !releaseVersion.test(version))
    throw Error("Rollback request is invalid.");
  await request(socket, { op: "rollback-start", version }, 15000);
  return { started: true, version };
}

export async function startUpdate(
  socket: string,
  version: string,
): Promise<{ started: true; version: string }> {
  if (typeof version !== "string" || !releaseVersion.test(version))
    throw Error("Update request is invalid.");
  await request(socket, { op: "update-start", version }, 15000);
  return { started: true, version };
}

export async function restartService(
  socket: string,
  target: "runner" | "gateway",
): Promise<{ restarted: true; target: "runner" | "gateway" }> {
  if (target !== "runner" && target !== "gateway")
    throw Error("Service restart request is invalid.");
  const value: any = await request(socket, { op: "service-restart", target }, 65000);
  if (value?.restarted !== true || value.target !== target)
    throw Error("Service restart response is invalid.");
  return { restarted: true, target };
}

export async function readBackups(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "backups" }, 20000);
  if (
    value?.format !== 1 ||
    !Array.isArray(value.items) ||
    typeof value.fingerprint !== "string" ||
    !Number.isSafeInteger(value.keep)
  )
    throw Error("Backups response is invalid.");
  return value;
}

export async function pruneBackups(
  socket: string,
  fingerprint: string,
): Promise<{ removed: number }> {
  if (typeof fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(fingerprint))
    throw Error("Backup cleanup request is invalid.");
  const value: any = await request(socket, { op: "backups-prune", fingerprint }, 120000);
  if (!Number.isSafeInteger(value?.removed))
    throw Error("Backup cleanup response is invalid.");
  return { removed: value.removed };
}

export async function startRestore(
  socket: string,
  id: string,
): Promise<{ started: true; id: string; version: string }> {
  if (typeof id !== "string" || !/^agentd-backup-[a-z0-9_]{4,32}$/.test(id))
    throw Error("Backup restore request is invalid.");
  const value: any = await request(socket, { op: "backups-restore", id }, 15000);
  if (value?.started !== true || value.id !== id || typeof value.version !== "string")
    throw Error("Backup restore was refused.");
  return { started: true, id, version: value.version };
}

export async function readCliApprovals(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "cli" }, 15000);
  if (value?.format !== 1 || !Array.isArray(value.items))
    throw Error("CLI approvals response is invalid.");
  return value;
}

export async function startCliInstall(
  socket: string,
  id: string,
): Promise<{ started: true; id: string }> {
  if (
    typeof id !== "string" ||
    !/^(?:cursor_[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[a-f0-9]{7,12}|claude_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}|codex_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4})$/.test(
      id,
    )
  )
    throw Error("CLI install request is invalid.");
  const value: any = await request(socket, { op: "cli-install", id }, 15000);
  if (value?.started !== true || value.id !== id) throw Error("CLI install was refused.");
  return { started: true, id };
}

export async function readAdapters(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "adapters" });
  if (
    value?.format !== 1 ||
    !Array.isArray(value.enabled) ||
    !Array.isArray(value.supported) ||
    typeof value.fingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.fingerprint)
  )
    throw Error("Adapter policy response is invalid.");
  return value;
}

export async function applyAdapters(
  socket: string,
  enabled: string[],
  editing: boolean,
  editAdapters: string[],
): Promise<any> {
  const value: any = await request(
    socket,
    { op: "adapters-apply", enabled, editing, editAdapters },
    15000,
  );
  if (
    value?.format !== 1 ||
    !Array.isArray(value.enabled) ||
    typeof value.fingerprint !== "string"
  )
    throw Error("Adapter policy change was refused.");
  return value;
}

export async function readRuntimeFlags(socket: string): Promise<any> {
  const value: any = await request(socket, { op: "runtime-flags" });
  if (
    value?.format !== 1 ||
    !value.flags ||
    typeof value.fingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.fingerprint)
  )
    throw Error("Runtime flags response is invalid.");
  return value;
}

export async function applyRuntimeFlags(socket: string, flags: object): Promise<any> {
  const value: any = await request(socket, { op: "runtime-flags-apply", flags }, 15000);
  if (value?.format !== 1 || !value.flags || typeof value.fingerprint !== "string")
    throw Error("Runtime flags change was refused.");
  return value;
}

export async function replaceTls(
  socket: string,
  certificate: string,
  key: string,
): Promise<any> {
  if (
    typeof certificate !== "string" ||
    typeof key !== "string" ||
    certificate.length > 16384 ||
    key.length > 16384
  )
    throw Error("TLS certificate request is invalid.");
  const value: any = await request(
    socket,
    { op: "tls-replace", certificate, key },
    20000,
  );
  if (value?.format !== 1 || value.replaced !== true)
    throw Error("TLS certificate change was refused.");
  return value;
}
