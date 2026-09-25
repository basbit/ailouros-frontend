const DEFAULT_SECRET_BYTES = 32;

/** A random secret from the browser's CSPRNG, as lowercase hex (2 chars per byte). */
export function generateSecretHex(byteCount: number = DEFAULT_SECRET_BYTES): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
