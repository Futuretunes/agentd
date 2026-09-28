import { fileURLToPath } from "node:url";
/** Required namespace/capability policy; never retry with a weaker sandbox. */
export const namespacePolicy = Object.freeze([
  "--die-with-parent",
  "--new-session",
  "--unshare-user",
  "--disable-userns",
  "--assert-userns-disabled",
  "--unshare-pid",
  "--unshare-ipc",
  "--unshare-net",
  "--unshare-uts",
  "--hostname",
  "agentd-worker",
  "--unshare-cgroup-try",
  "--cap-drop",
  "ALL",
]);
export function sandboxCommand(args: string[], binary = "/usr/bin/bwrap") {
  return {
    command: "/usr/bin/python3",
    args: [
      "-I",
      fileURLToPath(new URL("./sandbox-launch.py", import.meta.url)),
      binary,
      ...args,
    ],
  };
}
