/**
 * Server-side Excel member importer. SheetJS handles both .xlsx and legacy
 * .xls files; field rules are shared with manual member creation.
 */
import * as XLSX from "xlsx";
import { sanitizeDateOfBirth, sanitizeGender, sanitizeGrade, sanitizeName, sanitizePhone } from "./member-fields";
import type { ImportRowStatus, MatchableRow } from "./member-fields";

export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;

export type ImportField = "name" | "phone" | "date_of_birth" | "member_code" | "grade" | "gender";

export interface DetectedColumns {
  name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  member_code: string | null;
  grade: string | null;
  gender: string | null;
}

export interface ParsedMemberRow extends MatchableRow {
  name: string;
  phone: string | null;
  date_of_birth: string | null;
  member_code: string | null;
  grade: "prep_1" | "prep_2" | "prep_3" | null;
  gender: "male" | "female" | null;
}

export interface InvalidRow {
  row: number;
  name: string | null;
  reason: string;
}

export interface ParsedWorkbook {
  fileName: string;
  sheetName: string;
  headerRow: number;
  columns: DetectedColumns;
  totalDataRows: number;
  valid: ParsedMemberRow[];
  invalid: InvalidRow[];
}

export class ImportError extends Error {
  readonly detectedColumns: DetectedColumns | null;
  constructor(message: string, detectedColumns: DetectedColumns | null = null) {
    super(message);
    this.name = "ImportError";
    this.detectedColumns = detectedColumns;
  }
}

export function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0629/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

const NAME_KEYS = new Set(["name", "full_name", "fullname", "member_name", "student_name", "الاسم", "اسم", "الاسم_الكامل", "اسم_العضو", "اسم_الطالب"]);
const PHONE_KEYS = new Set(["phone", "phone_number", "phoneno", "mobile", "tel", "telephone", "contact", "رقم_التليفون", "رقم_الهاتف", "التليفون", "الهاتف", "تليفون", "هاتف", "رقم_الموبايل", "موبايل", "جوال", "الموبايل"]);
const DOB_KEYS = new Set(["date_of_birth", "dob", "birth_date", "birthday", "birthdate", "تاريخ_الميلاد", "تاريخ_ميلاد", "الميلاد", "المواليد", "تاريخ"]);
const CODE_KEYS = new Set(["member_code", "code", "membercode", "member_id", "id", "كود", "كود_العضو", "رقم_العضو", "رقم_العضوية"]);
const GRADE_KEYS = new Set(["grade", "class", "year", "school_year", "الصف", "السنة_الدراسية", "الصف_الدراسي"]);
const GENDER_KEYS = new Set(["gender", "sex", "النوع", "الجنس"]);

function classifyHeader(raw: string): ImportField | null {
  const header = normalizeHeader(raw);
  if (!header) return null;
  if (PHONE_KEYS.has(header) || ["phone", "tel", "contact", "تليفون", "هاتف", "موبايل", "جوال"].some((key) => header.includes(key))) return "phone";
  if (DOB_KEYS.has(header) || ["birth", "dob", "ميلاد", "مواليد"].some((key) => header.includes(key))) return "date_of_birth";
  if (CODE_KEYS.has(header) || ["member_code", "_code", "كود", "العضوية"].some((key) => header.includes(key))) return "member_code";
  if (GRADE_KEYS.has(header) || ["grade", "class", "year", "صف", "دراسي", "السنة"].some((key) => header.includes(key))) return "grade";
  if (GENDER_KEYS.has(header) || ["gender", "sex", "نوع", "جنس"].some((key) => header.includes(key))) return "gender";
  if (NAME_KEYS.has(header) || header.includes("اسم")) return "name";
  return null;
}

function cellText(cell: unknown): string {
  return cell === null || cell === undefined || cell instanceof Date ? "" : String(cell).trim();
}

function emptyRow(row: unknown[]): boolean {
  return row.every((cell) => cellText(cell) === "");
}

export function parseMembersWorkbook(fileName: string, data: Uint8Array): ParsedWorkbook {
  if (!data.byteLength) throw new ImportError("الملف فارغ");
  if (data.byteLength > IMPORT_MAX_FILE_BYTES) throw new ImportError("حجم الملف يتجاوز الحد الأقصى (2MB)");

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array", cellDates: true });
  } catch {
    throw new ImportError("تعذّر قراءة الملف — تأكد أنه ملف Excel (.xlsx أو .xls) صالح");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet || !sheet["!ref"]) throw new ImportError("الملف لا يحتوي على أي بيانات");
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, blankrows: true, defval: null });
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headerIndex = grid.findIndex((row) => row && !emptyRow(row));
  if (headerIndex < 0) throw new ImportError("الملف لا يحتوي على أي بيانات");

  const headers = (grid[headerIndex] ?? []).map(cellText);
  const indexes: Record<ImportField, number | null> = {
    name: null, phone: null, date_of_birth: null, member_code: null, grade: null, gender: null,
  };
  const detected: DetectedColumns = { name: null, phone: null, date_of_birth: null, member_code: null, grade: null, gender: null };
  headers.forEach((header, index) => {
    const field = classifyHeader(header);
    if (field && indexes[field] === null) {
      indexes[field] = index;
      detected[field] = header;
    }
  });
  if (indexes.name === null) throw new ImportError("يجب أن يحتوي الملف على عمود الاسم أو Name", detected);

  const valid: ParsedMemberRow[] = [];
  const invalid: InvalidRow[] = [];
  const dataRows = grid.slice(headerIndex + 1).filter((row) => row && !emptyRow(row));
  if (dataRows.length > IMPORT_MAX_ROWS) throw new ImportError(`الملف يتجاوز الحد الأقصى (${IMPORT_MAX_ROWS} صف)`, detected);
  const valueAt = (row: unknown[], field: ImportField) => indexes[field] === null ? null : row[indexes[field]!];

  dataRows.forEach((row, offset) => {
    const excelRow = range.s.r + headerIndex + offset + 2;
    const name = sanitizeName(valueAt(row, "name"));
    if (!name) {
      invalid.push({ row: excelRow, name: null, reason: "الاسم مفقود" });
      return;
    }
    if (name.length > 120) {
      invalid.push({ row: excelRow, name, reason: "الاسم طويل جدًا (الأقصى 120 حرفًا)" });
      return;
    }
    const phone = sanitizePhone(valueAt(row, "phone"));
    if (!phone.ok) {
      invalid.push({ row: excelRow, name, reason: phone.error });
      return;
    }
    const dob = sanitizeDateOfBirth(valueAt(row, "date_of_birth"));
    if (!dob.ok) {
      invalid.push({ row: excelRow, name, reason: dob.error });
      return;
    }
    const memberCode = sanitizeName(valueAt(row, "member_code"));
    if (memberCode.length > 32) {
      invalid.push({ row: excelRow, name, reason: "كود العضو طويل جدًا (الأقصى 32 حرفًا)" });
      return;
    }
    const grade = sanitizeGrade(valueAt(row, "grade"));
    if (!grade.ok) {
      invalid.push({ row: excelRow, name, reason: grade.error });
      return;
    }
    const gender = sanitizeGender(valueAt(row, "gender"));
    if (!gender.ok) {
      invalid.push({ row: excelRow, name, reason: gender.error });
      return;
    }
    valid.push({ row: excelRow, name, phone: phone.value, date_of_birth: dob.value, member_code: memberCode || null, grade: grade.value as ParsedMemberRow["grade"], gender: gender.value as ParsedMemberRow["gender"] });
  });

  if (!valid.length && !invalid.length) throw new ImportError("الملف لا يحتوي على أي صفوف بيانات", detected);
  return {
    fileName,
    sheetName,
    headerRow: range.s.r + headerIndex + 1,
    columns: detected,
    totalDataRows: dataRows.length,
    valid,
    invalid,
  };
}

export interface ImportPreviewRow extends ParsedMemberRow {
  status: ImportRowStatus;
  reason: string | null;
}

export interface ImportPreview {
  fileName: string;
  sheetName: string;
  headerRow: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  columns: DetectedColumns;
  counts: { new: number; existing: number; possible_duplicate: number; duplicate_in_file: number; invalid: number };
  preview: ImportPreviewRow[];
  invalid: InvalidRow[];
  warnings: string[];
}

export interface ImportResult {
  fileName: string;
  total: number;
  imported: number;
  skippedExisting: number;
  skippedPossible: number;
  skippedDuplicates: number;
  skipped: number;
  failed: number;
  failures: InvalidRow[];
  skippedRows: Array<{ row: number; name: string; status: ImportRowStatus; reason: string }>;
}
