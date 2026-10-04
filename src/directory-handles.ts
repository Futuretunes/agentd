import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readSync,
  readdirSync,
  readlinkSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeSync,
  type BigIntStats,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Node has no openat/mkdirat/unlinkat. On Linux, `/proc/self/fd/<dir>/<name>` resolves
// <name> inside the directory the descriptor holds, wherever that directory now is and
// whatever its old path now points at. Every operation here acts on one final name
// inside an already verified directory handle, never on a multi-component path.

export type FileId = [dev: string, ino: string];
export class UnsafePath extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`unsafe path: ${reason}`);
    this.reason = reason;
  }
}

const dirFlags = constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW;
const handle = (dir: number) => `/proc/self/fd/${dir}`;
function at(dir: number, name: string) {
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\0"))
    throw new UnsafePath("name");
  return `${handle(dir)}/${name}`;
}
export const idOf = (info: BigIntStats): FileId => [String(info.dev), String(info.ino)];
const same = (info: BigIntStats, id: FileId) =>
  String(info.dev) === id[0] && String(info.ino) === id[1];
const code = (error: unknown) => (error as NodeJS.ErrnoException).code;

let supported: boolean | undefined;
/** Whether directory-relative operations are available. Callers must refuse to mutate
 * when they are not. */
export function directoryRelativeSupported() {
  if (supported !== undefined) return supported;
  supported = false;
  if (process.platform !== "linux") return supported;
  let base: string | undefined, fd: number | undefined;
  try {
    base = mkdtempSync(join(tmpdir(), "agentd-dirfd-"));
    mkdirSync(join(base, "held"));
    fd = openSync(join(base, "held"), dirFlags);
    mkdirSync(at(fd, "probe"));
    supported = lstatSync(join(base, "held", "probe")).isDirectory();
  } catch {
    supported = false;
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (base) rmSync(base, { recursive: true, force: true });
  }
  return supported;
}
const requireSupport = () => {
  if (!directoryRelativeSupported()) throw new UnsafePath("unsupported");
};

/** Open an absolute directory without following its final component and require the
 * expected identity. */
export function openRoot(path: string, id: FileId) {
  requireSupport();
  let fd: number;
  try {
    fd = openSync(path, dirFlags);
  } catch {
    throw new UnsafePath("root");
  }
  if (!same(fstatSync(fd, { bigint: true }), id)) {
    closeSync(fd);
    throw new UnsafePath("root replaced");
  }
  return fd;
}

/** A second descriptor for the same directory object. The /proc entry is a magic link
 * to the held object, not a path, so it must be followed. */
export function reopen(dir: number) {
  return openSync(handle(dir), constants.O_RDONLY | constants.O_DIRECTORY);
}

export function lstatAt(dir: number, name: string): BigIntStats | null {
  try {
    return lstatSync(at(dir, name), { bigint: true });
  } catch (error) {
    if (code(error) === "ENOENT") return null;
    throw new UnsafePath("unreadable");
  }
}

/** Open a child directory: never a symlink, same device, and the expected inode if
 * one is known. */
export function openDirAt(dir: number, name: string, dev: string, ino?: string) {
  let fd: number;
  try {
    fd = openSync(at(dir, name), dirFlags);
  } catch (error) {
    throw new UnsafePath(
      ["ELOOP", "ENOTDIR"].includes(code(error) ?? "")
        ? "not a plain directory"
        : "missing",
    );
  }
  const info = fstatSync(fd, { bigint: true });
  if (
    !info.isDirectory() ||
    String(info.dev) !== dev ||
    (ino && String(info.ino) !== ino)
  ) {
    closeSync(fd);
    throw new UnsafePath("directory replaced");
  }
  return fd;
}

/** Walk `parts` from `root`, one verified component at a time. `expect` returns the
 * journaled identity for a relative directory path, if any; `onOpen` sees each
 * component's identity (to journal it). The caller closes the returned descriptor. */
export function openChain(
  root: number,
  parts: string[],
  dev: string,
  expect: (rel: string) => FileId | undefined,
  onOpen?: (rel: string, id: FileId) => void,
) {
  let fd = reopen(root);
  for (let i = 0; i < parts.length; i++) {
    const rel = parts.slice(0, i + 1).join("/"),
      id = expect(rel);
    let next: number;
    try {
      next = openDirAt(fd, parts[i], dev, id?.[1]);
    } finally {
      closeSync(fd);
    }
    fd = next;
    onOpen?.(rel, idOf(fstatSync(fd, { bigint: true })));
  }
  return fd;
}

export type FileRead = { content: Buffer; id: FileId; mode: "100644" | "100755" };
/** Read a regular, single-link file in a verified directory without following links. */
export function readFileAt(
  dir: number,
  name: string,
  max: number,
  id?: FileId,
): FileRead | null {
  let fd: number;
  try {
    fd = openSync(
      at(dir, name),
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
  } catch {
    return null;
  }
  try {
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(max)) return null;
    if (id && !same(before, id)) return null;
    const content = Buffer.alloc(Number(before.size));
    let offset = 0;
    while (offset < content.length) {
      const n = readSync(fd, content, offset, content.length - offset, offset);
      if (n === 0) break;
      offset += n;
    }
    const after = fstatSync(fd, { bigint: true });
    if (
      offset !== content.length ||
      readSync(fd, Buffer.alloc(1), 0, 1, content.length) !== 0 ||
      after.size !== before.size ||
      after.mtimeNs !== before.mtimeNs ||
      after.ctimeNs !== before.ctimeNs
    )
      return null;
    return {
      content,
      id: idOf(before),
      mode: before.mode & 0o100n ? "100755" : "100644",
    };
  } finally {
    closeSync(fd);
  }
}

/** Create a new file exclusively in a verified directory; returns its identity. */
export function createFileAt(dir: number, name: string, content: string | Buffer) {
  const fd = openSync(
    at(dir, name),
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o644,
  );
  try {
    const bytes = Buffer.from(content);
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset);
    fsyncSync(fd);
    return idOf(fstatSync(fd, { bigint: true }));
  } finally {
    closeSync(fd);
  }
}

export const mkdirAt = (dir: number, name: string) => mkdirSync(at(dir, name), 0o755);
export const readdirAt = (dir: number) => readdirSync(handle(dir)).sort();
export const readlinkAt = (dir: number, name: string) => readlinkSync(at(dir, name));

/** Unlink `name` only if it is still the expected non-directory entry. */
export function unlinkAt(dir: number, name: string, id: FileId) {
  const info = lstatAt(dir, name);
  if (!info || info.isDirectory() || !same(info, id))
    throw new UnsafePath("file replaced");
  unlinkSync(at(dir, name));
}

/** Remove `name` only if it is still the expected, empty directory. */
export function rmdirAt(dir: number, name: string, id: FileId) {
  const info = lstatAt(dir, name);
  if (!info?.isDirectory() || !same(info, id)) throw new UnsafePath("directory replaced");
  rmdirSync(at(dir, name));
}
