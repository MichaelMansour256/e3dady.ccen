// Temporary probe 2: list every table/RPC exposed by the project's PostgREST schema.
import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("key type:", key.slice(0, 11) + "...");

const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const spec = await res.json();
const paths = Object.keys(spec.paths || {});
const rpcs = paths.filter((p) => p.startsWith("/rpc/"));
console.log("tables:", paths.filter((p) => !p.startsWith("/rpc/")).join(", "));
console.log("rpcs:", rpcs.join(", ") || "(none)");
