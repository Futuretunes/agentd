import { createHash, timingSafeEqual } from "node:crypto";

export const accessKeyHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export function accessKeyMatches(value: unknown, expected: string) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(expected)) return false;
  return timingSafeEqual(
    Buffer.from(accessKeyHash(value), "hex"),
    Buffer.from(expected, "hex"),
  );
}

export function validateAccessKey(value: unknown) {
  if (typeof value !== "string" || value.length < 24 || value.length > 128)
    throw Error("Use an access key containing 24 to 128 characters.");
  if (/\s/.test(value) || new Set(value).size < 12)
    throw Error("Use a less predictable access key without spaces.");
  return value;
}
