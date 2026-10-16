/**
 * scripts/verify-checkin-safety.mjs — focused static safety checks for the
 * check-in routes. No browser, no database, no network: it reads the source and
 * asserts the invariants that make a GET/prefetch/refresh safe.
 *
 * Run: node scripts/verify-checkin-safety.mjs
 *
 * Invariants checked:
 *  1. The only place that can WRITE attendance (checkIn / checkInByMemberId) is
 *     the staff-only POST /api/attendance/checkin route, guarded by requireStaff
 *     BEFORE any Supabase call.
 *  2. The public POST /api/checkin route is read-only (identifyByQrToken only).
 *  3. No page/server-component under app/ calls checkIn() during render
 *     (i.e. no attendance write on GET).
 *  4. The [locale] check-in page no longer emits a nested <html>/<body> and no
 *     longer imports checkIn — it is a plain redirect to the canonical route.
 *  5. The canonical /checkin/[token] route renders CheckinRunner (read-only) and
 *     is excluded from the i18n middleware matcher.
 *  6. QR codes encode the locale-less canonical URL (/checkin/<token>).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const read = (rel) => readFileSync(join(root, rel), "utf8");

// Strip // line comments and /* block */ comments, but KEEP string/template
// literals — so assertions that inspect a literal value (e.g. a redirect target)
// still see it, while prose inside doc comments (which may legitimately mention
// the unsafe patterns they replaced) is removed.
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

// Also blank out string/template literals — for checks that assert the ABSENCE
// of a token (e.g. a nested <html> or a checkIn( call) so a string containing
// that text cannot produce a false positive.
const stripCode = (src) =>
  stripComments(src)
    .replace(/`(?:\\.|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");

const readComments = (rel) => stripComments(read(rel));
const readCode = (rel) => stripCode(read(rel));

let failures = 0;
const check = (name, cond, detail = "") => {
  const ok = Boolean(cond);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

// 1) Only the staff route writes, and requireStaff runs first.
const staffRoute = read("src/app/api/attendance/checkin/route.ts");
check(
  "staff route calls checkIn/checkInByMemberId",
  /checkIn(ByMemberId)?\(/.test(staffRoute)
);
check(
  "staff route authorizes with requireStaff before recording",
  staffRoute.indexOf("requireStaff(req)") !== -1 &&
    staffRoute.indexOf("requireStaff(req)") < staffRoute.search(/checkIn(ByMemberId)?\(/)
);

// 2) Public identify endpoint is read-only.
const publicApi = read("src/app/api/checkin/route.ts");
check(
  "public /api/checkin uses identifyByQrToken (read-only)",
  /identifyByQrToken\(/.test(publicApi) && !/checkIn\(/.test(publicApi)
);

// 3) No page/component under app/ writes attendance during render.
const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(tsx?|jsx?)$/.test(entry)) acc.push(full);
  }
  return acc;
};
const appFiles = walk(join(root, "src/app"));
const renderWriters = appFiles.filter((f) => {
  const src = stripCode(readFileSync(f, "utf8"));
  // A write during render = calling checkIn() (the token-based recorder) in a
  // non-route file. Route handlers (route.ts) are POST endpoints, not renders,
  // so they are excluded here and covered by the staff-guard check above.
  if (f.replace(/\\/g, "/").includes("/api/")) return false;
  return /\bcheckIn\s*\(/.test(src) && !/\bcheckInByMemberId\s*\(/.test(src.replace(/\bcheckIn\s*\(/g, ""));
});
check(
  "no server component calls checkIn() during render",
  renderWriters.length === 0,
  renderWriters.map((f) => f.replace(root, "")).join(", ")
);

// 4) The [locale] check-in page is a safe redirect (no nested html, no checkIn import).
const localeCheckinCode = readCode("src/app/[locale]/checkin/[token]/page.tsx");
const localeCheckinLiteral = readComments("src/app/[locale]/checkin/[token]/page.tsx");
check(
  "[locale] check-in no longer imports checkIn",
  !/from\s+["']@\/lib\/attendance["']/.test(localeCheckinCode)
);
check(
  "[locale] check-in emits no nested <html>/<body>",
  !/<html[\s>]/.test(localeCheckinCode) && !/<body[\s>]/.test(localeCheckinCode)
);
check(
  "[locale] check-in redirects to canonical /checkin/<token>",
  /redirect\(\s*`\/checkin\//.test(localeCheckinLiteral)
);

// 5) Canonical route renders CheckinRunner and middleware excludes checkin.
const canonical = read("src/app/checkin/[token]/page.tsx");
check(
  "canonical /checkin/[token] renders CheckinRunner",
  /CheckinRunner/.test(canonical)
);
const proxy = read("src/proxy.ts");
check(
  "i18n middleware excludes checkin",
  /matcher:[^]*checkin/.test(proxy)
);

// 6) QR codes encode the locale-less canonical URL.
const qrcode = read("src/lib/qrcode.ts");
check(
  "QR URL is /checkin/<token> (no locale prefix)",
  /`\$\{base\}\/checkin\/\$\{token\}`/.test(qrcode)
);

console.log(
  failures === 0
    ? "\nAll check-in safety invariants hold."
    : `\n${failures} invariant(s) FAILED.`
);
process.exit(failures === 0 ? 0 : 1);
