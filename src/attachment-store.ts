/** Only the trusted runner accesses stored images. Never accept a filesystem path. */
import { randomUUID } from "node:crypto";
import {
  constants,
  openSync,
  closeSync,
  fstatSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  lstatSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
const maximum = 5 * 1024 * 1024;
export function attachmentStore(root: string) {
  function file(name: string, limit: number) {
    const fd = openSync(
      join(root, name),
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    try {
      const s = fstatSync(fd);
      if (!s.isFile() || s.nlink !== 1 || s.size > limit)
        throw Error("Invalid attachment file");
      return readFileSync(fd);
    } finally {
      closeSync(fd);
    }
  }
  function metadata(id: string) {
    if (
      typeof id !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
    )
      throw Error("Invalid attachment");
    const meta = JSON.parse(file(id + ".json", 4096).toString("utf8"));
    if (
      meta.id !== id ||
      ![".png", ".jpg"].includes(meta.ext) ||
      typeof meta.name !== "string"
    )
      throw Error("Invalid attachment metadata");
    return { id, ext: meta.ext as string, name: meta.name as string };
  }
  function extension(bytes: Buffer) {
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? ".png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? ".jpg"
        : null;
  }
  function upload(input: { data: unknown; name?: unknown }) {
    if (typeof input.data !== "string" || input.data.length > 7_000_000)
      throw Error("Invalid image data");
    const bytes = Buffer.from(input.data, "base64");
    if (bytes.toString("base64") !== input.data)
      throw Error("Invalid image data");
    if (bytes.length < 16 || bytes.length > maximum)
      throw Error("Images must be at most 5 MB");
    const ext = extension(bytes);
    if (!ext) throw Error("Choose a JPEG or PNG image");
    const total = readdirSync(root).reduce(
      (n, name) => n + lstatSync(join(root, name)).size,
      0,
    );
    if (total + bytes.length + 4096 > 200 * 1024 * 1024)
      throw Error("Attachment storage is full");
    const id = randomUUID(),
      meta = {
        id,
        ext,
        name: String(input.name ?? "Image")
          .replace(/[\x00-\x1f]/g, "")
          .slice(0, 120),
      };
    writeFileSync(join(root, id + ext), bytes, { flag: "wx", mode: 0o600 });
    try {
      writeFileSync(join(root, id + ".json"), JSON.stringify(meta), {
        flag: "wx",
        mode: 0o600,
      });
    } catch (e) {
      unlinkSync(join(root, id + ext));
      throw e;
    }
    return meta;
  }
  function read(id: string) {
    const meta = metadata(id),
      bytes = file(id + meta.ext, maximum);
    if (extension(bytes) !== meta.ext) throw Error("Invalid image");
    return { ...meta, data: bytes.toString("base64") };
  }
  return { upload, metadata, read };
}
