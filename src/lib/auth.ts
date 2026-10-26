import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { LOGIN_MAX_FAILS, LOGIN_WINDOW_MS, clientIpHash } from "./rateLimit";

/*
 * ───────────── Admin authentication ─────────────
 * • Password: stored only as a bcrypt hash (slow, salted → stolen hashes are hard to crack).
 * • Session: a JWT signed with AUTH_SECRET (HMAC-SHA256) inside an httpOnly cookie.
 *   httpOnly = JavaScript can't read it (XSS can't steal it); Secure = HTTPS only;
 *   SameSite=Strict = the browser never sends it on requests started by other sites (CSRF).
 * • The token carries the admin's `session_version`. "Sign out everywhere" increments the
 *   number in the DB, so every older token instantly stops matching.
 * • Every admin page, server action and API route calls getSession()/requireAdmin() itself —
 *   the proxy redirect is only a convenience and is never trusted for security.
 */

const COOKIE = "ehsan_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set and at least 32 characters");
  return new TextEncoder().encode(s);
}

export type Admin = { id: number; email: string };

export async function getSession(): Promise<Admin | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const [user] = await getDb()
      .select({ id: schema.adminUser.id, email: schema.adminUser.email, v: schema.adminUser.sessionVersion })
      .from(schema.adminUser)
      .where(eq(schema.adminUser.id, id))
      .limit(1);
    if (!user || user.v !== payload.v) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null; // expired, tampered or signed with another secret
  }
}

/** For pages: redirect to the login screen when not signed in. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getSession();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions / route handlers: throw instead of redirecting. */
export class AuthError extends Error {}
export async function assertAdmin(): Promise<Admin> {
  const admin = await getSession();
  if (!admin) throw new AuthError("Not signed in");
  return admin;
}

async function setSessionCookie(id: number, version: number) {
  const token = await new SignJWT({ v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

// A valid bcrypt hash of a random string: comparing against it when the email is unknown
// makes a wrong email take as long as a wrong password (no "which emails exist" timing leak).
const DUMMY_HASH = "$2b$12$Th4Amno9OSksKIQhIsQw5uxDH4R.ADsEbogPO694e1oevWMTomV8q";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const db = getDb();
  const ipHash = await clientIpHash();
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);

  // Brute-force protection: at most 5 failed attempts per IP per 15 minutes.
  const [{ fails }] = await db
    .select({ fails: count() })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.ipHash, ipHash), eq(schema.loginAttempts.success, false), gt(schema.loginAttempts.createdAt, since)));
  if (fails >= LOGIN_MAX_FAILS) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }

  const [user] = await db
    .select()
    .from(schema.adminUser)
    .where(eq(schema.adminUser.email, email.trim().toLowerCase()))
    .limit(1);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  await db.insert(schema.loginAttempts).values({ ipHash, success: !!(user && valid) });

  if (!user || !valid) return { ok: false, error: "Invalid email or password." }; // generic on purpose
  await setSessionCookie(user.id, user.sessionVersion);
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export async function signOutEverywhere(adminId: number) {
  const db = getDb();
  const [u] = await db.select().from(schema.adminUser).where(eq(schema.adminUser.id, adminId)).limit(1);
  if (!u) return;
  await db
    .update(schema.adminUser)
    .set({ sessionVersion: u.sessionVersion + 1, updatedAt: new Date() })
    .where(eq(schema.adminUser.id, adminId));
  await logout();
}

export async function changePassword(adminId: number, current: string, next: string): Promise<LoginResult> {
  if (next.length < 12) return { ok: false, error: "New password must be at least 12 characters." };
  const db = getDb();
  const [u] = await db.select().from(schema.adminUser).where(eq(schema.adminUser.id, adminId)).limit(1);
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) return { ok: false, error: "Current password is wrong." };
  const version = u.sessionVersion + 1; // also signs out other devices
  await db
    .update(schema.adminUser)
    .set({ passwordHash: await bcrypt.hash(next, 12), sessionVersion: version, updatedAt: new Date() })
    .where(eq(schema.adminUser.id, adminId));
  await setSessionCookie(adminId, version);
  return { ok: true };
}

export async function recentLoginAttempts(limit = 20) {
  return getDb()
    .select()
    .from(schema.loginAttempts)
    .orderBy(desc(schema.loginAttempts.createdAt))
    .limit(limit);
}
