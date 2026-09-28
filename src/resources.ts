import { gitOutput } from "./git-policy.ts";
import {
  constants,
  openSync,
  closeSync,
  writeSync,
  statfsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  fstatSync,
  ftruncateSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { type ChildProcess } from "node:child_process";

export const resourceLimits = Object.freeze({
  logBytes: 8 * 1024 * 1024,
  answerBytes: 512000,
  worktreeBytes: 1024 * 1024 * 1024,
  worktreeEntries: 50000,
  reserveBytes: 2 * 1024 * 1024 * 1024,
});
export type Limits = typeof resourceLimits;
export function freeBytes(path: string) {
  const s = statfsSync(path);
  return Number(s.bavail) * Number(s.bsize);
}
export function requireSpace(paths: string[], reserve = resourceLimits.reserveBytes) {
  for (const path of paths)
    if (freeBytes(path) < reserve)
      throw Error(
        "Disk reserve reached. Review storage cleanup before starting more work.",
      );
}

/** Bounded inventory: no link traversal. Used only while idle for deletion previews. */
export function inventory(path: string, maximum = resourceLimits.worktreeEntries) {
  const root = realpathSync(path);
  if (root !== resolve(path)) throw Error("Linked storage path refused");
  const hash = createHash("sha256");
  let bytes = 0,
    entries = 0;
  function walk(dir: string) {
    for (const name of readdirSync(dir).sort()) {
      if (++entries > maximum)
        throw Error("Storage inventory is too large; preserve for manual review");
      const file = join(dir, name),
        s = lstatSync(file);
      hash.update(
        JSON.stringify([
          file.slice(root.length),
          s.dev,
          s.ino,
          s.mode,
          s.size,
          s.mtimeMs,
          s.ctimeMs,
        ]),
      );
      bytes += s.isFile() ? Math.max(s.size, s.blocks * 512) : 0;
      if (s.isDirectory()) walk(file);
    }
  }
  const info = lstatSync(path);
  if (!info.isDirectory()) throw Error("Expected a storage directory");
  hash.update(JSON.stringify([info.dev, info.ino]));
  walk(root);
  return { bytes, entries, fingerprint: hash.digest("hex") };
}

/** Pipe both output streams; a child never gets an unbounded writable log fd. */
export function captureOutput(
  child: ChildProcess,
  path: string,
  stop: (reason: string) => void,
  limit = resourceLimits.logBytes,
  answer = false,
) {
  const open = (file: string) => {
    const fd = openSync(
      file,
      constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW,
      0o600,
    );
    try {
      const s = fstatSync(fd);
      if (!s.isFile() || s.nlink !== 1) throw Error("Invalid output file");
      ftruncateSync(fd, 0);
      return fd;
    } catch (e) {
      closeSync(fd);
      throw e;
    }
  };
  const fd = open(path);
  let answerFd: number | null = null;
  try {
    if (answer) answerFd = open(path + ".answer");
  } catch (e) {
    closeSync(fd);
    throw e;
  }
  let bytes = 0,
    answerBytes = 0,
    limited = false,
    closed = false;
  const consume = (chunk: Buffer, stdout: boolean) => {
    if (closed || limited) return;
    try {
      const remaining = limit - bytes,
        part = chunk.subarray(0, Math.max(0, remaining));
      if (part.length) {
        writeSync(fd, part);
        bytes += part.length;
      }
      if (stdout && answerFd !== null && answerBytes < resourceLimits.answerBytes) {
        const value = part.subarray(0, resourceLimits.answerBytes - answerBytes);
        writeSync(answerFd, value);
        answerBytes += value.length;
      }
      if (chunk.length > remaining) {
        limited = true;
        stop("Output limit reached");
      }
    } catch {
      limited = true;
      stop("Could not safely write task output");
    }
  };
  child.stdout!.on("data", (chunk) => consume(chunk, true));
  child.stderr!.on("data", (chunk) => consume(chunk, false));
  child.once("close", () => {
    closed = true;
    closeSync(fd);
    if (answerFd !== null) closeSync(answerFd);
  });
  return () => bytes;
}

/** A monitored disk guard, not a filesystem quota: fast writes can overshoot. */
export function monitorWorktree(
  path: string,
  paths: string[],
  stop: (reason: string) => void,
  limits: Limits = resourceLimits,
  interval = 2000,
) {
  const timer = setInterval(() => {
    try {
      requireSpace(paths, limits.reserveBytes);
      const value = inventory(path, limits.worktreeEntries);
      if (value.bytes > limits.worktreeBytes) stop("Worktree size limit reached");
    } catch (e) {
      stop((e as Error).message);
    }
  }, interval);
  timer.unref();
  return () => clearInterval(timer);
}
export function serviceBudget() {
  try {
    const line = readFileSync("/proc/self/cgroup", "utf8")
      .split("\n")
      .find((x) => x.startsWith("0::"));
    if (!line) throw Error();
    const relative = line.slice(3);
    if (relative.includes("..")) throw Error();
    const dir = join("/sys/fs/cgroup", relative);
    const read = (name: string) => readFileSync(join(dir, name), "utf8").trim();
    const [quota, period] = read("cpu.max").split(" "),
      memory = read("memory.max"),
      tasks = read("pids.max");
    return {
      available: true,
      memoryMax: memory === "max" ? null : Number(memory),
      tasksMax: tasks === "max" ? null : Number(tasks),
      cpuCores: quota === "max" ? null : Number(quota) / Number(period),
    };
  } catch {
    return {
      available: false,
      memoryMax: null,
      tasksMax: null,
      cpuCores: null,
    };
  }
}

export function checkoutBudget(
  repo: string,
  revision: string,
  limits: Limits = resourceLimits,
) {
  const data = gitOutput(repo, ["ls-tree", "-r", "-l", "-z", revision], {
    maxBuffer: 16 * 1024 * 1024,
  });
  let bytes = 0,
    entries = 0;
  for (const item of data.split("\0")) {
    if (!item) continue;
    const metadata = item.split("\t", 1)[0].trim().split(/\s+/);
    if (++entries > limits.worktreeEntries)
      throw Error("Worktree entry limit reached before checkout");
    if (metadata[1] === "blob") bytes += Number(metadata[3]);
    if (!Number.isSafeInteger(bytes) || bytes > limits.worktreeBytes)
      throw Error("Worktree size limit reached before checkout");
  }
  return bytes;
}
