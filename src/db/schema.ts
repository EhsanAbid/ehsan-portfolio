import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  bigint,
  customType,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Postgres `bytea` column for raw file bytes (media is stored in Neon).
 * The Neon HTTP driver may hand bytea back as a Buffer, a Uint8Array or a
 * "\x0a1b..." hex string depending on runtime, so fromDriver normalises all three.
 * We write it as the hex text form, which Postgres accepts for bytea everywhere.
 */
const bytea = customType<{ data: Buffer; driverData: string | Buffer | Uint8Array }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return "\\x" + Buffer.from(value).toString("hex");
  },
  fromDriver(value) {
    if (typeof value === "string") {
      return Buffer.from(value.startsWith("\\x") ? value.slice(2) : value, "hex");
    }
    return Buffer.from(value);
  },
});

/** Every draft / published / archived copy of the whole site lives here as one JSONB document. */
export const siteVersions = pgTable(
  "site_versions",
  {
    id: serial("id").primaryKey(),
    status: text("status", { enum: ["draft", "published", "archived"] }).notNull(),
    data: jsonb("data").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [index("site_versions_status_idx").on(t.status)],
);

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    /** sha256 (first 24 hex chars) of the stored bytes — also the public URL key. */
    hash: text("hash").notNull(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    bytes: bytea("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    size: integer("size").notNull(),
    alt: text("alt").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("media_hash_idx").on(t.hash)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    spam: boolean("spam").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Salted hash of the sender IP — only used for rate limiting, never shown. */
    ipHash: text("ip_hash").notNull(),
  },
  (t) => [index("messages_ip_idx").on(t.ipHash, t.createdAt)],
);

/** Simple key → counter table (e.g. "visits", "unlock:hello-world"). */
export const stats = pgTable("stats", {
  key: text("key").primaryKey(),
  count: bigint("count", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUser = pgTable("admin_user", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** Bumped by "sign out everywhere": every cookie carrying an older version becomes invalid. */
  sessionVersion: integer("session_version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    success: boolean("success").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_ip_idx").on(t.ipHash, t.createdAt)],
);
