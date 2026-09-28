// Shared conservative review/publication policy. Findings never contain matched values.
export const scanLimits = Object.freeze({
  blobBytes: 1024 * 1024,
  totalBytes: 4 * 1024 * 1024,
  files: 1000,
});
export function sensitiveFilename(name: string) {
  return /(^|\/)(\.env($|\.)|\.credentials\.json$|auth\.json$|\.npmrc$|\.netrc$|_netrc$|\.git-credentials$|\.pypirc$|id_(rsa|dsa|ecdsa|ed25519)($|\.)|\.aws\/(credentials|config)$)|\.(pem|key|p12|pfx|keystore)$/i.test(
    name,
  );
}
export function sensitiveContent(value: string) {
  const reasons: string[] = [];
  if (
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/.test(
      value,
    )
  )
    reasons.push("private key");
  if (
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-(?:ant-|proj-)[A-Za-z0-9_-]{30,})\b/.test(
      value,
    )
  )
    reasons.push("provider credential");
  if (/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/.test(value))
    reasons.push("cloud access credential");
  // A narrow assignment heuristic supplements known credential signatures. It is
  // intentionally not an entropy oracle and does not promise complete secret detection.
  const assignments =
    /(?:["']?(?:refresh_token|access_token|client_secret|api_key|apikey)["']?\s*[:=]\s*)["']([A-Za-z0-9_./+\-=]{24,})["']/gi;
  for (const match of value.matchAll(assignments)) {
    if (
      !/^(?:example|placeholder|changeme|your[_-]|test[_-]|fake[_-])/i.test(
        match[1],
      ) &&
      new Set(match[1]).size >= 10
    ) {
      reasons.push("credential assignment");
      break;
    }
  }
  return reasons;
}
export function binaryNumstat(value: string) {
  return value.split("\0").some((record) => record.startsWith("-\t-\t"));
}
export type ContentScan = { bytes: number; seen: Set<string> };
export const contentScan = (): ContentScan => ({ bytes: 0, seen: new Set() });
export function acceptBlob(scan: ContentScan, sha: string, sizeText: string) {
  if (scan.seen.has(sha)) return false;
  const size = Number(sizeText.trim());
  if (
    !Number.isSafeInteger(size) ||
    size < 0 ||
    size > scanLimits.blobBytes ||
    scan.bytes + size > scanLimits.totalBytes
  )
    throw Error(
      "Sensitive-data scan exceeds its size limit. Review these changes separately.",
    );
  scan.seen.add(sha);
  scan.bytes += size;
  return true;
}
// ls-tree metadata separates the blob ID from an arbitrary literal filename.
export function blobID(entry: string) {
  if (!entry) return null;
  const match = /^\d+ blob ([a-f0-9]{40,64})\t/.exec(entry);
  if (!match)
    throw Error("Unsupported changed object. Review these changes separately.");
  return match[1];
}
