"use server";

import { requireUserId } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/auth";
import { getCookieTranslations } from "@/i18n/server";
import { getMonthlySummary } from "@/actions/transaction/actions";
import { ai } from "@/lib/genai";
import { ThinkingLevel } from "@google/genai";

const SUGGESTION_MODEL = "gemini-3.6-flash";

// One concrete suggestion generated from the user's own numbers, never generic advice.
export type AISuggestion = {
  title: string;
  explanation: string;
  actionLabel: string;
  actionMessage: string;
};

type SuggestionResult =
  | { suggestion: AISuggestion }
  | { error: string }
  | { noData: true };

// Reads the current user's profile and this-month figures, then asks Gemini for a
// single actionable suggestion grounded in those real numbers.
export async function getAISuggestion(): Promise<SuggestionResult> {
  await requireUserId();
  const t = await getCookieTranslations("dashboard.aiSuggestion");

  const [profile, summary] = await Promise.all([
    getCurrentProfile(),
    getMonthlySummary(),
  ]);

  const current = summary.current;

  // No business activity yet: nothing meaningful to derive from real data.
  if (current.businessIncome === 0 && current.businessExpense === 0) {
    return { noData: true };
  }

  const topCost = summary.spendingByCategory[0];

  // Compact snapshot of real figures for Gemini to reference (never invent numbers).
  const snapshot = {
    businessName: profile.business_name ?? "Usaha anda",
    businessType: profile.business_type ?? "belum ditetapkan",
    period: `${current.startDate} s.d. ${current.endDate}`,
    businessIncome: current.businessIncome,
    businessExpense: current.businessExpense,
    profit: current.profit,
    profitMarginPercent: current.profitMarginPercent,
    cashLeft: current.cashLeft,
    ownerTaken: current.ownerTaken,
    ownerWithdrawals: current.ownerWithdrawals,
    ceremony: current.ceremony,
    topCostCategory: topCost?.category ?? null,
    topCostAmount: topCost?.total ?? 0,
  };

  const prompt = `
Anda adalah AI Advisor di TAMAS. Buat SATU saran tindakan yang spesifik untuk pemilik usaha mikro di Bali, berdasarkan data nyata di bawah ini. Jangan buat angka baru; gunakan hanya angka yang tersedia dan sebut setidaknya satu di antaranya agar jelas bahwa saran ini dari data pengguna, bukan jawaban umum.

Data nyata pengguna (Rupiah):
${JSON.stringify(snapshot, null, 2)}

Aturan:
- Bahasa Indonesia, gaya sehari-hari, tanpa istilah akuntansi.
- Judul maksimal 6 kata.
- Penjelasan tepat 2 kalimat.
- actionLabel: label tombol aksi singkat (contoh "Catat belanja", "Lihat laba", "Tetapkan batas ambilan").
- actionMessage: satu pertanyaan yang bisa dikirim ke AI Advisor untuk membahas saran ini lebih dalam, menyebut angka milik pengguna.

Keluarkan HANYA JSON valid, tanpa penutup atau teks lain:
{
  "title": "...",
  "explanation": "...",
  "actionLabel": "...",
  "actionMessage": "..."
}
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: SUGGESTION_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4,
        maxOutputTokens: 512,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
          includeThoughts: false,
        },
      },
    });

    const text = response.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);

    const suggestion: AISuggestion = {
      title: String(parsed.title ?? "").slice(0, 60),
      explanation: String(parsed.explanation ?? "").slice(0, 300),
      actionLabel: String(parsed.actionLabel ?? t("actionDefault")).slice(
        0,
        40,
      ),
      actionMessage: String(parsed.actionMessage ?? "").slice(0, 500),
    };

    return { suggestion };
  } catch (error) {
    console.error("[ai-suggestion] failed", error);
    return { error: t("failed") };
  }
}
