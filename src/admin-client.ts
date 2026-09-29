import { createConnection } from "node:net";

function request(socket: string, input: object): Promise<unknown> {
  if (!socket.startsWith("/"))
    return Promise.reject(Error("Administration is unavailable."));
  return new Promise((resolve, reject) => {
    const connection = createConnection(socket);
    let response = "";
    connection.setTimeout(5000, () =>
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
