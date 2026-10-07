/**
 * Shared member-field sanitisation and duplicate matching.
 *
 * This module is safe to use from server routes and client type imports. Empty
 * optional fields are always represented as NULL, never as invalid values.
 */

export type FieldResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export type ImportRowStatus =
  | "new"
  | "existing"
  | "possible_duplicate"
  | "duplicate_in_file";

export type MemberGrade = "prep_1" | "prep_2" | "prep_3";
export type MemberGender = "male" | "female";

export const MEMBER_GRADES: Array<{ value: MemberGrade; label: string }> = [
  { value: "prep_1", label: "أولى إعدادي" },
  { value: "prep_2", label: "تانية إعدادي" },
  { value: "prep_3", label: "تالتة إعدادي" },
];

export const MEMBER_GENDERS: Array<{ value: MemberGender; label: string }> = [
  { value: "male", label: "ولد" },
  { value: "female", label: "بنت" },
];

export interface MatchableMember {
  name: string;
  member_code?: string | null;
  phone?: string | null;
}

export interface MatchableRow {
  row: number;
  name: string;
  phone?: string | null;
  date_of_birth?: string | null;
  grade?: MemberGrade | null;
  member_code?: string | null;
}

export interface ClassifiedRow<T extends MatchableRow> {
  row: T;
  status: ImportRowStatus;
  reason: string | null;
}

const AR_INDIC = "٠١٢٣٤٥٦٧٨٩";
const AR_INDIC_EXT = "۰۱۲۳۴۵۶۷۸۹";
const PLACEHOLDERS = new Set(["-", "–", "—", "n/a", "na", "none", "null", "لا يوجد", "بدون"]);
const PHONE_OK = /^\+?\d{7,15}$/;

export function gradeLabel(grade: MemberGrade | null | undefined): string {
  return MEMBER_GRADES.find((item) => item.value === grade)?.label ?? "غير محدد";
}

export function genderLabel(gender: MemberGender | null | undefined): string {
  return MEMBER_GENDERS.find((item) => item.value === gender)?.label ?? "غير محدد";
}

export function sanitizeGender(raw: unknown): FieldResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  const value = toAsciiDigits(asString(raw))
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (isPlaceholder(value)) return { ok: true, value: null };
  const compact = value.replace(/\s/g, "");
  if (["male", "m", "ذكر", "ولد"].includes(compact)) {
    return { ok: true, value: "male" };
  }
  if (["female", "f", "انثى", "بنت"].includes(compact)) {
    return { ok: true, value: "female" };
  }
  return { ok: false, error: "النوع غير صالح — استخدم ولد أو بنت" };
}

export function sanitizeGrade(raw: unknown): FieldResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  const value = toAsciiDigits(asString(raw))
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (isPlaceholder(value)) return { ok: true, value: null };
  const compact = value.replace(/\s/g, "");
  if (["prep_1", "prep1", "1", "1اعدادي", "اولىاعدادي", "اولياعدادي", "اولىاعدادى"].includes(compact)) {
    return { ok: true, value: "prep_1" };
  }
  if (["prep_2", "prep2", "2", "2اعدادي", "ثانيةاعدادي", "تانيةاعدادي", "ثانيهاعدادي"].includes(compact)) {
    return { ok: true, value: "prep_2" };
  }
  if (["prep_3", "prep3", "3", "3اعدادي", "ثالثةاعدادي", "تالتةاعدادي", "ثالثهاعدادي"].includes(compact)) {
    return { ok: true, value: "prep_3" };
  }
  return { ok: false, error: "الصف الدراسي غير صالح — استخدم أولى أو تانية أو تالتة إعدادي" };
}

export function toAsciiDigits(raw: string): string {
  let result = "";
  for (const char of raw) {
    const arabic = AR_INDIC.indexOf(char);
    if (arabic >= 0) {
      result += String(arabic);
      continue;
    }
    const extended = AR_INDIC_EXT.indexOf(char);
    result += extended >= 0 ? String(extended) : char;
  }
  return result;
}

function asString(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw.trim();
  if (raw instanceof Date) return raw.toISOString();
  return String(raw).trim();
}

function isPlaceholder(value: string): boolean {
  return value === "" || PLACEHOLDERS.has(value.toLowerCase());
}

export function sanitizeName(raw: unknown): string {
  return asString(raw)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePhone(raw: unknown): FieldResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };

  let value: string;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0 || !Number.isInteger(raw)) {
      return { ok: false, error: "رقم التليفون غير صالح" };
    }
    value = String(raw);
    if (/^[1-9]\d{9}$/.test(value)) value = `0${value}`;
  } else {
    value = toAsciiDigits(asString(raw));
  }

  if (isPlaceholder(value)) return { ok: true, value: null };
  value = value.replace(/[\s\-().\u00A0]/g, "");
  if (value === "") return { ok: true, value: null };
  if (value.startsWith("00")) value = value.slice(2);
  if (/^201\d{8}$/.test(value)) value = `0${value.slice(2)}`;
  if (!PHONE_OK.test(value)) return { ok: false, error: "رقم التليفون غير صالح" };
  return { ok: true, value };
}

const BAD_DATE = "صيغة تاريخ الميلاد غير صالحة — استخدم يوم/شهر/سنة أو YYYY-MM-DD";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoFromParts(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function isoFromSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 80000) return null;
  const date = new Date(Math.round((serial - 25569) * 86400000));
  return isoFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function dateRangeCheck(iso: string): FieldResult {
  const today = new Date();
  const todayIso = `${today.getUTCFullYear()}-${pad2(today.getUTCMonth() + 1)}-${pad2(today.getUTCDate())}`;
  return iso > todayIso ? { ok: false, error: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" } : { ok: true, value: iso };
}

export function sanitizeDateOfBirth(raw: unknown): FieldResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return { ok: false, error: BAD_DATE };
    const iso = isoFromParts(raw.getUTCFullYear(), raw.getUTCMonth() + 1, raw.getUTCDate());
    return iso ? dateRangeCheck(iso) : { ok: false, error: BAD_DATE };
  }
  if (typeof raw === "number") {
    const iso =
      Number.isInteger(raw) && raw >= 19000101 && raw <= 21001231
        ? isoFromParts(Math.floor(raw / 10000), Math.floor(raw / 100) % 100, raw % 100)
        : isoFromSerial(raw);
    return iso ? dateRangeCheck(iso) : { ok: false, error: BAD_DATE };
  }

  const value = toAsciiDigits(asString(raw));
  if (isPlaceholder(value)) return { ok: true, value: null };
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(value);
  if (match) {
    const iso = isoFromParts(Number(match[1]), Number(match[2]), Number(match[3]));
    return iso ? dateRangeCheck(iso) : { ok: false, error: BAD_DATE };
  }
  match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value);
  if (match) {
    const iso = isoFromParts(Number(match[3]), Number(match[2]), Number(match[1]));
    return iso ? dateRangeCheck(iso) : { ok: false, error: BAD_DATE };
  }
  return { ok: false, error: BAD_DATE };
}

export function nameMatchKey(name: string): string {
  return sanitizeName(name)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0629/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function phoneMatchKey(phone: string | null | undefined): string {
  return phone ? toAsciiDigits(phone).replace(/\D/g, "") : "";
}

export function memberCodeMatchKey(code: string | null | undefined): string {
  return code ? code.trim().toLowerCase().replace(/\s+/g, "") : "";
}

export function classifyImportRows<T extends MatchableRow>(
  rows: T[],
  existing: MatchableMember[]
): ClassifiedRow<T>[] {
  const byCode = new Set<string>();
  const byNamePhone = new Set<string>();
  const byName = new Set<string>();
  for (const member of existing) {
    const code = memberCodeMatchKey(member.member_code);
    if (code) byCode.add(code);
    const name = nameMatchKey(member.name);
    if (name) {
      byName.add(name);
      const phone = phoneMatchKey(member.phone);
      if (phone) byNamePhone.add(`${name}|${phone}`);
    }
  }

  const publish = (row: T) => {
    const name = nameMatchKey(row.name);
    const code = memberCodeMatchKey(row.member_code);
    const phone = phoneMatchKey(row.phone);
    if (code) byCode.add(code);
    if (name) {
      byName.add(name);
      if (phone) byNamePhone.add(`${name}|${phone}`);
    }
  };

  return rows.map((row) => {
    const name = nameMatchKey(row.name);
    const code = memberCodeMatchKey(row.member_code);
    const phone = phoneMatchKey(row.phone);
    if (code && byCode.has(code)) {
      return { row, status: "existing", reason: "موجود بالفعل — طابق كود العضو" };
    }
    if (phone && byNamePhone.has(`${name}|${phone}`)) {
      return { row, status: "existing", reason: "موجود بالفعل — طابق الاسم ورقم التليفون" };
    }
    if (name && byName.has(name)) {
      return { row, status: "possible_duplicate", reason: "يوجد عضو بنفس الاسم — تم التخطي للمراجعة اليدوية" };
    }
    publish(row);
    return { row, status: "new", reason: null };
  });
}

export function allocateMemberCodes(
  existingCodes: string[],
  needed: number,
  reserved: Iterable<string> = []
): string[] {
  const taken = new Set([...existingCodes, ...reserved].map(memberCodeMatchKey));
  let max = 0;
  let prefix = "M";
  let width = 3;
  for (const code of existingCodes) {
    const match = /^(.*?)(\d+)$/.exec(code.trim());
    if (match && Number(match[2]) > max) {
      max = Number(match[2]);
      prefix = match[1] || "M";
      width = Math.max(3, match[2].length);
    }
  }
  const result: string[] = [];
  for (let number = max + 1; result.length < needed; number += 1) {
    const candidate = `${prefix}${String(number).padStart(width, "0")}`;
    if (!taken.has(memberCodeMatchKey(candidate))) {
      result.push(candidate);
      taken.add(memberCodeMatchKey(candidate));
    }
  }
  return result;
}
