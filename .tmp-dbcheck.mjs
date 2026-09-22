// Temporary probe: inspect the real Supabase project used by this repo.
// Prints ONLY error codes/messages and row counts — never credentials.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("supabase host:", new URL(url).host);
const sb = createClient(url, anon);

async function probe(table, opts = {}) {
  let q = sb.from(table).select("*", { count: "exact" }).limit(3);
  if (opts.order) q = q.order(opts.order, { ascending: false });
  const { data, error, count } = await q;
  if (error) {
    console.log(
      `[${table}] ERROR code=${error.code} message=${error.message} details=${error.details ?? ""} hint=${error.hint ?? ""}`
    );
    return null;
  }
  console.log(`[${table}] OK count=${count} sampleKeys=${data?.[0] ? Object.keys(data[0]).join(",") : "-"}`);
  return data;
}

for (const t of ["notifications_history", "prayer_requests", "members", "meetings", "attendance"]) {
  await probe(t);
}

// Does the anon key have write access to the new tables / existing ones?
const ins = await sb.from("notifications_history").insert({ id: crypto.randomUUID(), sent_at: "0", heading_ar: "", heading_en: "", message_ar: "", message_en: "", url: "/ar", status: "probe", created_at: new Date().toISOString() });
console.log("notifications_history INSERT:", ins.error ? `ERROR code=${ins.error.code} ${ins.error.message}` : "OK");

const mem = await sb.from("members").insert({ member_code: "__PROBE__", name: "probe", qr_token: crypto.randomUUID().replace(/-/g, "") }).select();
console.log("members INSERT:", mem.error ? `ERROR code=${mem.error.code} ${mem.error.message}` : `OK id=${mem.data[0].id}`);
if (!mem.error) {
  const del = await sb.from("members").delete().eq("member_code", "__PROBE__");
  console.log("members DELETE:", del.error ? `ERROR code=${del.error.code} ${del.error.message}` : "OK (cleanup)");
}
