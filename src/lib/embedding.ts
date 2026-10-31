import { ai } from "@/lib/genai";
import { Transaction } from "@/types/transaction";

// Must match the VECTOR(768) column in migrations/001-transactions.sql.
const EMBEDDING_DIMENSIONS = 768;

// Deliberately not a server action: "use server" would expose this as a public endpoint that spends tokens.
export async function generateEmbedding(contents: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length === 0) {
    throw new Error("Failed to generate embedding");
  }

  return values;
}

// Every searchable field goes in, so a query like "kopi bulan ini" can match on description, category, or date.
export function toEmbeddingText(
  transaction: Omit<Transaction, "id" | "user_id" | "embedding">,
): string {
  const date =
    transaction.date instanceof Date
      ? transaction.date.toISOString().slice(0, 10)
      : transaction.date;

  return [
    `Type: ${transaction.type}`,
    `Category: ${transaction.category}`,
    `Description: ${transaction.description}`,
    `Amount: ${transaction.amount}`,
    `Date: ${date}`,
  ].join("\n");
}
