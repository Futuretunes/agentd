import { createConnection } from "node:net";

export function rotateAccessKey(
  socket: string,
  currentKey: string,
  newHash: string,
): Promise<{ rotated: true }> {
  if (
    !socket.startsWith("/") ||
    typeof currentKey !== "string" ||
    currentKey.length > 256
  )
    return Promise.reject(Error("Access-key rotation is unavailable."));
  if (!/^[a-f0-9]{64}$/.test(newHash))
    return Promise.reject(Error("Access-key rotation request is invalid."));
  return new Promise((resolve, reject) => {
    const connection = createConnection(socket);
    let response = "";
    connection.setTimeout(5000, () =>
      connection.destroy(Error("Admin helper timed out")),
    );
    connection.on("connect", () =>
      connection.end(
        JSON.stringify({ op: "rotate-access-key", currentKey, newHash }) + "\n",
      ),
    );
    connection.on("data", (chunk) => {
      response += chunk;
      if (Buffer.byteLength(response) > 4096)
        connection.destroy(Error("Admin helper response is too large"));
    });
    connection.on("error", () => reject(Error("Access-key rotation is unavailable.")));
    connection.on("end", () => {
      try {
        const value = JSON.parse(response);
        if (!value?.ok) throw Error("Access-key rotation was refused.");
        resolve({ rotated: true });
      } catch {
        reject(Error("Access-key rotation was refused."));
      }
    });
  });
}
