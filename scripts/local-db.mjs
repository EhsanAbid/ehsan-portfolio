// Local development database — DEV ONLY, never deployed.
//
// Runs a real Postgres (PGlite = Postgres compiled to WebAssembly) in this one
// Node process and exposes it over HTTP using the same tiny protocol that
// Neon's serverless HTTP driver speaks:
//   POST /sql  body {query, params}            -> {fields, rows, command, rowCount}
//   POST /sql  body {queries:[{query,params}]} -> {results:[...]}   (one transaction)
// Rows are returned as raw Postgres text, exactly like Neon does, so the app's
// driver parses types itself. Result: the app runs the *same* code path locally
// as in production — only the endpoint differs (see src/db/client.ts).
//
// One process owns the data folder (.pglite/), so `next dev`, `next build`
// workers and the seed script can all use it at the same time safely.

import http from "node:http";
import { PGlite } from "@electric-sql/pglite";

const PORT = Number(process.env.LOCAL_DB_PORT ?? 4444);
// A parsers map that returns every value untouched (= Postgres text format).
// Built-in type OIDs are all below 16384; user-defined types default to text anyway.
const rawText = {};
for (let oid = 1; oid < 16384; oid++) rawText[oid] = (value) => value;

// Neon receives bytea parameters as "\x0a1b…" hex text; PGlite's default bytea serializer
// only accepts Uint8Array, so pass hex strings through unchanged (OID 17 = bytea).
const serializers = {
  17: (v) => (typeof v === "string" ? v : "\\x" + Buffer.from(v).toString("hex")),
};

const db = await PGlite.create(process.env.LOCAL_DB_DIR ?? ".pglite", { parsers: rawText, serializers });

let queue = Promise.resolve();
/** PGlite is single-connection: run requests one after another. */
const serial = (fn) => (queue = queue.then(fn, fn));

async function runOne(tx, { query, params }) {
  const res = await tx.query(query, params ?? [], { rowMode: "array" });
  const command = (query.trim().match(/^\w+/)?.[0] ?? "").toUpperCase();
  return {
    command,
    fields: res.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
    rows: res.rows.map((row) => row.map((v) => (v === null || v === undefined ? null : String(v)))),
    rowCount: res.affectedRows ?? res.rows.length,
  };
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("local neon-compatible db ok\n");
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () =>
    serial(async () => {
      try {
        const payload = JSON.parse(body);
        let out;
        if (Array.isArray(payload.queries)) {
          out = { results: await db.transaction(async (tx) => {
            const results = [];
            for (const q of payload.queries) results.push(await runOne(tx, q));
            return results;
          }) };
        } else {
          out = await runOne(db, payload);
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(out));
      } catch (err) {
        // Same shape as Neon's 400 errors so the driver rethrows them nicely.
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ message: err?.message ?? String(err), code: err?.code, detail: err?.detail }));
      }
    }),
  );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[local-db] Postgres (PGlite) on http://localhost:${PORT}/sql  data: .pglite/`);
});
