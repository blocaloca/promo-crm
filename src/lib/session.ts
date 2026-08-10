// Signed single-user session cookie. Uses Web Crypto (crypto.subtle) rather
// than Node's crypto module so this works identically in middleware, which
// runs on the Edge runtime, and in Server Actions, which run on Node.

const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 60; // 60 days, in seconds

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(process.env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function createSessionCookieValue(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = `1|${now}|${now + SESSION_MAX_AGE}`;
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionCookieValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const dot = value.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = value.slice(0, dot);

  let signature: Uint8Array;
  try {
    signature = fromBase64Url(value.slice(dot + 1));
  } catch {
    return false;
  }

  const key = await getKey();
  const valid = await crypto.subtle.verify("HMAC", key, signature as BufferSource, encoder.encode(payload));
  if (!valid) return false;

  const [version, , expiresAtStr] = payload.split("|");
  if (version !== "1") return false;
  const expiresAt = Number(expiresAtStr);
  return Number.isFinite(expiresAt) && Math.floor(Date.now() / 1000) < expiresAt;
}
