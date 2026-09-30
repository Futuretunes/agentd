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

export const ACCESS_KEY_RECOVERY = "/etc/agentd/mobile-access.txt";

export function accessKeyRecoveryStatus(path = ACCESS_KEY_RECOVERY, expectedUid = 0) {
  try {
    const info = lstatSync(path);
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      info.uid !== expectedUid ||
      info.size < 1 ||
      info.size > 4096 ||
      info.mode & 0o077
    )
      return { format: 1 as const, present: false };
    return { format: 1 as const, present: true };
  } catch {
    return { format: 1 as const, present: false };
  }
}

export function deleteAccessKeyRecovery(
  currentKey: unknown,
  mobileConfig: string,
  path = ACCESS_KEY_RECOVERY,
  expectedUid = 0,
) {
  if (typeof currentKey !== "string" || currentKey.length > 256)
    throw Error("Invalid access-key recovery request");
  const status = accessKeyRecoveryStatus(path, expectedUid);
  if (!status.present) throw Error("Access-key recovery file is not present");
  const info = lstatSync(mobileConfig);
  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size > 65536 ||
    info.uid !== expectedUid
  )
    throw Error("Invalid access configuration");
  const fd = openSync(mobileConfig, constants.O_RDONLY | constants.O_NOFOLLOW);
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(readFileSync(fd, "utf8"));
  } finally {
    closeSync(fd);
  }
  if (!accessKeyMatches(currentKey, String(value.accessHash ?? "")))
    throw Error("Current access key did not match");
  const recovery = lstatSync(path);
  if (
    !recovery.isFile() ||
    recovery.isSymbolicLink() ||
    recovery.uid !== expectedUid ||
    recovery.size < 1 ||
    recovery.size > 4096 ||
    recovery.mode & 0o077
  )
    throw Error("Access-key recovery file is not present");
  unlinkSync(path);
  return { deleted: true as const, format: 1 as const };
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

export function configurationOverview(
  command = "/opt/agentd/scripts/admin_configuration.py",
) {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 32768,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (value?.format !== 1 || !value.configuration || value.error)
    throw Error("Configuration overview unavailable");
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

// Rollback targets exactly the release the listing offers: the newest older version
// with a compatible completed backup. The job re-derives and re-checks it.
export function restartService(
  target: unknown,
  command = "/opt/agentd/scripts/admin_restart.py",
) {
  if (target !== "runner" && target !== "gateway") throw Error("Invalid restart request");
  const output = execFileSync("/usr/bin/python3", ["-B", command, target], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 65000,
    maxBuffer: 4096,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (!value?.restarted || value.target !== target)
    throw Error("Service restart refused");
  return { restarted: true as const, target: value.target as "runner" | "gateway" };
}

export function listBackups(command = "/opt/agentd/scripts/admin_backups.py") {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 65536,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (value?.format !== 1 || !Array.isArray(value.items) || value.error)
    throw Error("Backups unavailable");
  return value;
}

export function pruneBackups(
  fingerprint: unknown,
  command = "/opt/agentd/scripts/admin_backups.py",
) {
  if (typeof fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(fingerprint))
    throw Error("Invalid backup cleanup request");
  const output = execFileSync("/usr/bin/python3", ["-B", command, "prune", fingerprint], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 4096,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (value?.format !== 1 || !Number.isSafeInteger(value.removed))
    throw Error("Backup cleanup refused");
  return { removed: value.removed as number };
}

export function listCliApprovals(command = "/opt/agentd/scripts/admin_cli.py") {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 32768,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (value?.format !== 1 || !Array.isArray(value.items) || value.error)
    throw Error("CLI approvals unavailable");
  return value;
}

const cliApprovalId =
  /^(?:cursor_[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[a-f0-9]{7,12}|claude_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}|codex_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4})$/;

export function startCliInstall(
  id: unknown,
  list: () => any = listCliApprovals,
  start: (unit: string) => void = (unit) => {
    execFileSync("/usr/bin/systemctl", ["start", "--no-block", unit], {
      timeout: 10000,
      stdio: "ignore",
      env: { PATH: "/usr/bin:/bin", LANG: "C" },
    });
  },
) {
  if (typeof id !== "string" || !cliApprovalId.test(id))
    throw Error("Invalid CLI install request");
  const value = list();
  if (value.running) throw Error("A CLI install is already running");
  if (!value.items?.some((item: any) => item.id === id))
    throw Error("CLI approval is not available");
  start(`agentd-cli-install@${id}.service`);
  return { started: true as const, id };
}

const adapterId = /^(claude|codex|cursor)$/;

function normalizeAdapters(value: unknown) {
  if (!Array.isArray(value) || value.length > 3) throw Error("Invalid adapter policy");
  const items = value.map((item) => {
    if (typeof item !== "string" || !adapterId.test(item))
      throw Error("Invalid adapter policy");
    return item;
  });
  if (new Set(items).size !== items.length) throw Error("Invalid adapter policy");
  return items;
}

export function adapterPolicy(command = "/opt/agentd/scripts/admin_adapters.py") {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 8192,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (
    value?.format !== 1 ||
    !Array.isArray(value.enabled) ||
    typeof value.fingerprint !== "string" ||
    value.error
  )
    throw Error("Adapter policy unavailable");
  return value;
}

export function applyAdapterPolicy(
  enabled: unknown,
  editing: unknown,
  editAdapters: unknown,
  command = "/opt/agentd/scripts/admin_adapters.py",
) {
  const request = {
    enabled: normalizeAdapters(enabled),
    editing: editing === true,
    editAdapters: normalizeAdapters(editAdapters ?? []),
  };
  if (!request.enabled.length) throw Error("Invalid adapter policy");
  if (request.editing && !request.editAdapters.length)
    throw Error("Invalid adapter policy");
  if (!request.editing) request.editAdapters = [];
  if (request.editAdapters.some((item) => !request.enabled.includes(item)))
    throw Error("Invalid adapter policy");
  const output = execFileSync(
    "/usr/bin/python3",
    ["-B", command, JSON.stringify(request)],
    {
      cwd: "/opt/agentd",
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 8192,
      env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  const value = JSON.parse(output);
  if (
    value?.format !== 1 ||
    !Array.isArray(value.enabled) ||
    typeof value.fingerprint !== "string" ||
    value.error
  )
    throw Error("Adapter policy change refused");
  return value;
}

function normalizeRuntimeFlags(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid runtime flags");
  const flags = value as Record<string, unknown>;
  const normalized = {
    strictWorkers: flags.strictWorkers === true,
    credentialRenewal: flags.credentialRenewal === true,
    codexChat: flags.codexChat === true,
  };
  if ((normalized.credentialRenewal || normalized.codexChat) && !normalized.strictWorkers)
    throw Error("Invalid runtime flags");
  return normalized;
}

export function runtimeFlags(command = "/opt/agentd/scripts/admin_runtime_flags.py") {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 8192,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (
    value?.format !== 1 ||
    !value.flags ||
    typeof value.fingerprint !== "string" ||
    value.error
  )
    throw Error("Runtime flags unavailable");
  return value;
}

export function applyRuntimeFlags(
  flags: unknown,
  command = "/opt/agentd/scripts/admin_runtime_flags.py",
) {
  const request = { flags: normalizeRuntimeFlags(flags) };
  const output = execFileSync(
    "/usr/bin/python3",
    ["-B", command, JSON.stringify(request)],
    {
      cwd: "/opt/agentd",
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 8192,
      env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  const value = JSON.parse(output);
  if (
    value?.format !== 1 ||
    !value.flags ||
    typeof value.fingerprint !== "string" ||
    value.error
  )
    throw Error("Runtime flags change refused");
  return value;
}

export function configurationProfiles(command = "/opt/agentd/scripts/admin_profiles.py") {
  const output = execFileSync("/usr/bin/python3", ["-B", command], {
    cwd: "/opt/agentd",
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 8192,
    env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const value = JSON.parse(output);
  if (
    value?.format !== 1 ||
    typeof value.jobsEnabled !== "boolean" ||
    typeof value.running !== "boolean" ||
    typeof value.canEnableResource !== "boolean" ||
    typeof value.canEnableHardening !== "boolean" ||
    value.error
  )
    throw Error("Configuration profiles unavailable");
  return value;
}

const profileTarget = /^(resource|hardening)$/;

export function startProfileEnable(
  target: unknown,
  list: () => any = configurationProfiles,
  start: (command: string, args: string[]) => void = (command, args) => {
    execFileSync("/usr/bin/python3", ["-B", command, ...args], {
      cwd: "/opt/agentd",
      encoding: "utf8",
      timeout: 15000,
      maxBuffer: 8192,
      env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
      stdio: ["ignore", "pipe", "ignore"],
    });
  },
  command = "/opt/agentd/scripts/admin_profiles.py",
) {
  if (typeof target !== "string" || !profileTarget.test(target))
    throw Error("Invalid profile enable request");
  const value = list();
  if (value.running) throw Error("A profile apply job is already running");
  if (!value.jobsEnabled) throw Error("Configuration profile jobs are not enabled");
  if (target === "resource" && !value.canEnableResource)
    throw Error("Standard resource profile is not available to enable");
  if (target === "hardening" && !value.canEnableHardening)
    throw Error("Gateway hardening is not available to enable");
  start(command, ["start", target]);
  return { started: true as const, target };
}

export function replaceTlsCertificate(
  certificate: unknown,
  key: unknown,
  command = "/opt/agentd/scripts/admin_tls.py",
) {
  if (
    typeof certificate !== "string" ||
    typeof key !== "string" ||
    certificate.length > 16384 ||
    key.length > 16384
  )
    throw Error("Invalid TLS certificate request");
  const output = execFileSync(
    "/usr/bin/python3",
    ["-B", command, JSON.stringify({ certificate, key })],
    {
      cwd: "/opt/agentd",
      encoding: "utf8",
      timeout: 15000,
      maxBuffer: 8192,
      env: { PATH: "/usr/bin:/bin", LANG: "C", HOME: "/nonexistent" },
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  const value = JSON.parse(output);
  if (value?.format !== 1 || value.replaced !== true || value.error)
    throw Error("TLS certificate change refused");
  return value;
}

export function startRollback(
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
    throw Error("Invalid rollback request");
  const value = list();
  if (value.running) throw Error("An update or rollback is already running");
  if (value.configuration !== "ok") throw Error("Configuration needs review first");
  if (!value.rollback?.available || value.rollback.version !== version)
    throw Error("Rollback target is not available");
  start(`agentd-rollback@${version}.service`);
  return { started: true as const, version };
}

const backupId = /^agentd-backup-[a-z0-9_]{4,32}$/;

export function startRestore(
  id: unknown,
  list: () => any = listBackups,
  updatesList: () => any = updates,
  start: (unit: string) => void = (unit) => {
    execFileSync("/usr/bin/systemctl", ["start", "--no-block", unit], {
      timeout: 10000,
      stdio: "ignore",
      env: { PATH: "/usr/bin:/bin", LANG: "C" },
    });
  },
) {
  if (typeof id !== "string" || !backupId.test(id))
    throw Error("Invalid restore request");
  const value = list();
  if (!value.restoreEnabled) throw Error("Selected backup restore is not enabled");
  const item = value.items?.find((entry: any) => entry.id === id);
  if (!item?.restorable) throw Error("That managed backup cannot be restored");
  const updateState = updatesList();
  if (updateState.running) throw Error("An update or rollback is already running");
  if (updateState.configuration !== "ok") throw Error("Configuration needs review first");
  start(`agentd-restore@${id}.service`);
  return { started: true as const, id, version: item.version as string };
}

export function handleAdminRequest(
  input: any,
  config: {
    mobileConfig: string;
    diagnostics?: () => unknown;
    configuration?: () => unknown;
    updates?: () => unknown;
    startUnit?: (unit: string) => void;
    restart?: (target: unknown) => { restarted: true; target: "runner" | "gateway" };
    backups?: () => unknown;
    pruneBackups?: (fingerprint: unknown) => { removed: number };
    startRestore?: (id: unknown) => { started: true; id: string; version: string };
    cliApprovals?: () => unknown;
    startCliInstall?: (id: unknown) => { started: true; id: string };
    adapters?: () => unknown;
    applyAdapters?: (
      enabled: unknown,
      editing: unknown,
      editAdapters: unknown,
    ) => unknown;
    runtimeFlags?: () => unknown;
    applyRuntimeFlags?: (flags: unknown) => unknown;
    replaceTls?: (certificate: unknown, key: unknown) => unknown;
    profiles?: () => unknown;
    startProfile?: (target: unknown) => { started: true; target: string };
    accessKeyRecovery?: () => unknown;
    deleteAccessKeyRecovery?: (currentKey: unknown) => { deleted: true };
  },
) {
  if (input?.op === "rotate-access-key") {
    if (Object.keys(input).sort().join(" ") !== "currentKey newHash op")
      throw Error("Unsupported admin operation");
    rotateAccessFile(config.mobileConfig, input.currentKey, input.newHash);
    return { rotated: true };
  }
  if (input?.op === "access-key-recovery" && Object.keys(input).join(" ") === "op")
    return (config.accessKeyRecovery ?? accessKeyRecoveryStatus)();
  if (input?.op === "access-key-recovery-delete") {
    if (Object.keys(input).sort().join(" ") !== "currentKey op")
      throw Error("Unsupported admin operation");
    return (
      config.deleteAccessKeyRecovery ??
      ((currentKey: unknown) => deleteAccessKeyRecovery(currentKey, config.mobileConfig))
    )(input.currentKey);
  }
  if (input?.op === "diagnostics" && Object.keys(input).join(" ") === "op")
    return (config.diagnostics ?? diagnostics)();
  if (input?.op === "configuration" && Object.keys(input).join(" ") === "op")
    return (config.configuration ?? configurationOverview)();
  if (input?.op === "updates" && Object.keys(input).join(" ") === "op")
    return (config.updates ?? updates)();
  if (input?.op === "rollback-start") {
    if (Object.keys(input).sort().join(" ") !== "op version")
      throw Error("Unsupported admin operation");
    return startRollback(input.version, config.updates ?? updates, config.startUnit);
  }
  if (input?.op === "update-start") {
    if (Object.keys(input).sort().join(" ") !== "op version")
      throw Error("Unsupported admin operation");
    return startUpdate(input.version, config.updates ?? updates, config.startUnit);
  }
  if (input?.op === "service-restart") {
    if (Object.keys(input).sort().join(" ") !== "op target")
      throw Error("Unsupported admin operation");
    return (config.restart ?? restartService)(input.target);
  }
  if (input?.op === "backups" && Object.keys(input).join(" ") === "op")
    return (config.backups ?? listBackups)();
  if (input?.op === "backups-prune") {
    if (Object.keys(input).sort().join(" ") !== "fingerprint op")
      throw Error("Unsupported admin operation");
    return (config.pruneBackups ?? pruneBackups)(input.fingerprint);
  }
  if (input?.op === "backups-restore") {
    if (Object.keys(input).sort().join(" ") !== "id op")
      throw Error("Unsupported admin operation");
    if (config.startRestore) return config.startRestore(input.id);
    return startRestore(
      input.id,
      config.backups ?? listBackups,
      config.updates ?? updates,
      config.startUnit,
    );
  }
  if (input?.op === "cli" && Object.keys(input).join(" ") === "op")
    return (config.cliApprovals ?? listCliApprovals)();
  if (input?.op === "cli-install") {
    if (Object.keys(input).sort().join(" ") !== "id op")
      throw Error("Unsupported admin operation");
    return (config.startCliInstall ?? startCliInstall)(input.id);
  }
  if (input?.op === "adapters" && Object.keys(input).join(" ") === "op")
    return (config.adapters ?? adapterPolicy)();
  if (input?.op === "adapters-apply") {
    if (Object.keys(input).sort().join(" ") !== "editAdapters editing enabled op")
      throw Error("Unsupported admin operation");
    return (config.applyAdapters ?? applyAdapterPolicy)(
      input.enabled,
      input.editing,
      input.editAdapters,
    );
  }
  if (input?.op === "runtime-flags" && Object.keys(input).join(" ") === "op")
    return (config.runtimeFlags ?? runtimeFlags)();
  if (input?.op === "runtime-flags-apply") {
    if (Object.keys(input).sort().join(" ") !== "flags op")
      throw Error("Unsupported admin operation");
    return (config.applyRuntimeFlags ?? applyRuntimeFlags)(input.flags);
  }
  if (input?.op === "tls-replace") {
    if (Object.keys(input).sort().join(" ") !== "certificate key op")
      throw Error("Unsupported admin operation");
    return (config.replaceTls ?? replaceTlsCertificate)(input.certificate, input.key);
  }
  if (input?.op === "profiles" && Object.keys(input).join(" ") === "op")
    return (config.profiles ?? configurationProfiles)();
  if (input?.op === "profiles-enable") {
    if (Object.keys(input).sort().join(" ") !== "op target")
      throw Error("Unsupported admin operation");
    return (config.startProfile ?? startProfileEnable)(input.target);
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
    connection.setTimeout(20000, () => connection.destroy());
    connection.on("error", () => {});
    connection.on("data", (chunk) => {
      data += chunk;
      if (Buffer.byteLength(data) > 65536) return connection.destroy();
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
