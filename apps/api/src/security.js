import crypto from "node:crypto";
export const sha256=value=>crypto.createHash("sha256").update(value).digest("hex");
export const makeSecret=()=>crypto.randomBytes(32).toString("base64url");
export function redact(value=""){
 return String(value)
 .replace(/(authorization\s*[:=]\s*)(bearer\s+)?[^\s,;]+/gi,"$1[REDACTED]")
 .replace(/((?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*)[^\s,;]+/gi,"$1[REDACTED]")
 .replace(/(https?:\/\/)[^/@\s]+:[^/@\s]+@/gi,"$1[REDACTED]@");
}