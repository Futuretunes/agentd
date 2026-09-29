import { renewalFailure } from "./renewal.ts";
import { publicMessages } from "./public-error-messages.ts";
export const unknownError =
  "This action could not be completed. Refresh and try again; check local service diagnostics if it persists.";
const fixed = new Set([
  unknownError,
  renewalFailure,
  "A required file is unavailable. Refresh the project and retry.",
  "The service cannot access a required resource. Check the installation configuration.",
  "Storage is full. Review storage cleanup before retrying.",
  "The result exceeds the safe display limit. Reduce the changes or review them separately.",
  "The operation timed out. Refresh its status before retrying.",
  "Service stopped before completion",
  "Git output exceeds the safe review limit. Reduce the changes or review them separately.",
  "Output limit reached",
  "Worktree size limit reached",
  "Could not safely write task output",
  "Disk reserve reached. Review storage cleanup before starting more work.",
  "Storage inventory is too large; preserve for manual review",
  "Existing pull request reused; its current title, description and state were kept.",
]);
export function publicError(value: unknown) {
  const message =
    typeof value === "string" ? value : value instanceof Error ? value.message : "";
  if (
    publicMessages.has(message) ||
    fixed.has(message) ||
    /^Exit [0-9]{1,3}$/.test(message)
  )
    return message;
  const code = (value as NodeJS.ErrnoException | null)?.code;
  if (code === "ENOENT")
    return "A required file is unavailable. Refresh the project and retry.";
  if (code === "EACCES" || code === "EPERM")
    return "The service cannot access a required resource. Check the installation configuration.";
  if (code === "ENOSPC" || code === "EDQUOT")
    return "Storage is full. Review storage cleanup before retrying.";
  if (code === "ENOBUFS")
    return "The result exceeds the safe display limit. Reduce the changes or review them separately.";
  if (code === "ETIMEDOUT")
    return "The operation timed out. Refresh its status before retrying.";
  return unknownError;
}
// Normalize error metadata in returned jobs/tasks too, including old stored failures.
// User-authored prompts, answers and explicitly requested logs remain unchanged.
export function browserResult(value: any): any {
  if (Array.isArray(value)) return value.map(browserResult);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (
        (key === "error" || key === "settings_error") &&
        item !== null &&
        item !== undefined &&
        item !== ""
      )
        return [key, publicError(item)];
      if (key === "checks" && typeof item === "string") {
        try {
          return [key, JSON.stringify(browserResult(JSON.parse(item)))];
        } catch {
          return [key, null];
        }
      }
      return [key, browserResult(item)];
    }),
  );
}
