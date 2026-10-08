import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "e3dady_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function safeEqual(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) return false;
    return timingSafeEqual(
      leftBuffer,
      rightBuffer
    );
  } catch {
    return false;
  }
}

export function isValidAdminPassword(candidate: string | null): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  return Boolean(candidate && configured && safeEqual(candidate, configured));
}

export function createAdminSessionToken(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function isValidAdminSession(token: string | undefined): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(expiresAt).digest("base64url");
  return safeEqual(signature, expected);
}

export function isAuthorized(req: Request): boolean {
  const token = req.headers.get("cookie")?.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]+)`)
  )?.[1];
  return isValidAdminSession(token);
}
