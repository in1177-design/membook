export const ADMIN_SESSION_COOKIE = "admin_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("hex");
}

export async function createAdminSessionValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await hmac(String(expiresAt));
  return `${expiresAt}.${signature}`;
}

export async function isValidAdminSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [expiresAtRaw, signature] = value.split(".");
  if (!expiresAtRaw || !signature) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expectedSignature = await hmac(expiresAtRaw);
  return expectedSignature === signature;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  return password === expected;
}
