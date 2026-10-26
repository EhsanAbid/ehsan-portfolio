import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * We never store raw IP addresses. An IP is hashed together with the server secret
 * (a "salt"), so the stored value can only be used to compare "same visitor again?"
 * for rate limiting — it cannot be reversed or matched against other databases.
 */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? "dev"}|${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export async function clientIp() {
  const h = await headers();
  // On Vercel the first x-forwarded-for entry is the real client address.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function clientIpHash() {
  return hashIp(await clientIp());
}

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILS = 5;
export const CONTACT_WINDOW_MS = 10 * 60 * 1000;
export const CONTACT_MAX = 3;
