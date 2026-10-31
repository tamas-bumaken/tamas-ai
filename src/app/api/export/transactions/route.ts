import { getCookieTranslations } from "@/i18n/server";
import { getUserId } from "@/lib/auth";
import { getTodayInJakarta } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import z from "zod";

// PostgREST returns at most 1,000 rows per request, so the export reads page by page until a short page.
const PAGE_SIZE = 1000;

// Header labels live in "export.headers"; the values stay as stored, so the file reads the same in any language.
const CSV_COLUMNS = [
  "date",
  "type",
  "category",
  "amount",
  "description",
] as const;

// A leading =, +, -, @ (or tab/CR) makes spreadsheet apps run the cell as a formula (CSV injection).
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function toCsvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  const safe =
    typeof value === "string" && FORMULA_PREFIX.test(text) ? `'${text}` : text;

  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

// Numeric columns can arrive as strings depending on their size, so amount is coerced.
const exportRowSchema = z.object({
  date: z.string(),
  type: z.string(),
  category: z.string(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
});

type ExportRow = z.infer<typeof exportRowSchema>;

// Every transaction the user owns, for data portability (UU PDP). RLS limits the rows to the caller's own.
export async function GET() {
  const t = await getCookieTranslations("apiErrors");

  if (!(await getUserId())) {
    return Response.json({ error: t("unauthorized") }, { status: 401 });
  }

  const supabase = await createClient();
  const rows: ExportRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("date, type, category, amount, description")
      // id breaks ties, so pages never skip or repeat a row.
      .order("date", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("[api/export] transactions read failed", error);
      return Response.json({ error: t("exportFailed") }, { status: 500 });
    }

    const page = z.array(exportRowSchema).parse(data);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const tHeaders = await getCookieTranslations("export.headers");
  const lines = [
    CSV_COLUMNS.map((column) => toCsvCell(tHeaders(column))).join(","),
    ...rows.map((row) =>
      [row.date, row.type, row.category, row.amount, row.description]
        .map(toCsvCell)
        .join(","),
    ),
  ];
  // The BOM makes Excel read the file as UTF-8, so non-ASCII descriptions stay intact.
  const csv = `﻿${lines.join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tamas-transactions-${getTodayInJakarta()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
