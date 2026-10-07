/**
 * Excel member import: authenticated preview followed by authenticated,
 * server-side re-validation and one bulk insert.
 */
import { NextResponse } from "next/server";
import { classifyImportRows } from "@/lib/member-fields";
import { allocateMemberCodes } from "@/lib/member-fields";
import { createMembersBulk, listMembers } from "@/lib/attendance";
import { badRequest, databaseError, readJson, requireAdmin } from "@/lib/attendance-api";
import {
  ImportError,
  IMPORT_MAX_FILE_BYTES,
  parseMembersWorkbook,
  type ImportPreview,
  type ImportPreviewRow,
  type ImportResult,
  type ParsedWorkbook,
} from "@/lib/excel-import";
import { generateMembersTemplateWorkbook } from "@/lib/excel-export";

const PREVIEW_ROWS = 12;

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const workbook = await generateMembersTemplateWorkbook();
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="members-import-template.xlsx"',
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return databaseError("members.import.template", error);
  }
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await readJson<{ action?: unknown; fileName?: unknown; file?: unknown }>(req);
  const action = typeof body.action === "string" ? body.action : "";
  if (action !== "preview" && action !== "confirm") return badRequest('action must be "preview" or "confirm"');

  const fileName = typeof body.fileName === "string" && body.fileName.trim()
    ? body.fileName.trim().slice(0, 120)
    : "members.xlsx";
  const encoded = typeof body.file === "string" ? body.file : "";
  if (!encoded) return badRequest("file is required (base64-encoded .xlsx or .xls)");
  if (encoded.length > (IMPORT_MAX_FILE_BYTES * 4) / 3 + 4096) {
    return badRequest("حجم الملف يتجاوز الحد الأقصى (2MB)");
  }

  let parsed: ParsedWorkbook;
  try {
    parsed = parseMembersWorkbook(fileName, new Uint8Array(Buffer.from(encoded, "base64")));
  } catch (error) {
    if (error instanceof ImportError) {
      return NextResponse.json(
        { error: error.message, code: "parse_error", columns: error.detectedColumns },
        { status: 400 }
      );
    }
    return databaseError("members.import.parse", error);
  }

  try {
    const existing = await listMembers();
    const classified = classifyImportRows(parsed.valid, existing);
    const counts = {
      new: 0,
      existing: 0,
      possible_duplicate: 0,
      duplicate_in_file: 0,
      invalid: parsed.invalid.length,
    };
    for (const item of classified) counts[item.status] += 1;

    if (action === "preview") {
      const preview: ImportPreviewRow[] = classified.slice(0, PREVIEW_ROWS).map((item) => ({
        ...item.row,
        status: item.status,
        reason: item.reason,
      }));
      const warnings: string[] = [];
      if (counts.existing) warnings.push(`${counts.existing} صف يطابق عضوًا موجودًا بالفعل — سيتم تخطيه.`);
      if (counts.possible_duplicate) warnings.push(`${counts.possible_duplicate} صف بنفس الاسم لعضو موجود — سيتم تخطيه للمراجعة اليدوية.`);
      if (counts.duplicate_in_file) warnings.push(`${counts.duplicate_in_file} صف مكرر داخل الملف — سيتم تخطيه.`);
      if (counts.invalid) warnings.push(`${counts.invalid} صف به أخطاء ولن يتم استيراده.`);
      const payload: ImportPreview = {
        fileName: parsed.fileName,
        sheetName: parsed.sheetName,
        headerRow: parsed.headerRow,
        totalRows: parsed.totalDataRows,
        validRows: parsed.valid.length,
        invalidRows: parsed.invalid.length,
        columns: parsed.columns,
        counts,
        preview,
        invalid: parsed.invalid,
        warnings,
      };
      return NextResponse.json(payload);
    }

    const newRows = classified.filter((item) => item.status === "new");
    const suppliedCodes = newRows.map((item) => item.row.member_code).filter((code): code is string => Boolean(code));
    const generatedCodes = allocateMemberCodes(
      existing.map((member) => member.member_code),
      newRows.filter((item) => !item.row.member_code).length,
      suppliedCodes
    );
    let generatedIndex = 0;
    const toCreate = newRows.map((item) => ({
      member_code: item.row.member_code || generatedCodes[generatedIndex++],
      name: item.row.name,
      phone: item.row.phone,
      date_of_birth: item.row.date_of_birth,
      grade: item.row.grade,
      gender: item.row.gender,
    }));
    const created = await createMembersBulk(toCreate);
    const skippedRows = classified
      .filter((item) => item.status !== "new")
      .map((item) => ({
        row: item.row.row,
        name: item.row.name,
        status: item.status,
        reason: item.reason ?? "",
      }));
    const result: ImportResult = {
      fileName: parsed.fileName,
      total: parsed.totalDataRows,
      imported: created.length,
      skippedExisting: counts.existing,
      skippedPossible: counts.possible_duplicate,
      skippedDuplicates: counts.duplicate_in_file,
      skipped: counts.existing + counts.possible_duplicate + counts.duplicate_in_file,
      failed: counts.invalid,
      failures: parsed.invalid,
      skippedRows,
    };
    return NextResponse.json(result);
  } catch (error) {
    return databaseError(`members.import.${action}`, error);
  }
}
