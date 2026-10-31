// The single category list for the manual form, the wizard, the advisor and the landing page (decision D4).
// Values are stored in the database as-is; the UI shows their labels from the "categories" messages (D1).
// Mirrored by the transactions_category_check constraint (migrations/001): changing a list needs a new migration.
export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Housing",
  "Shopping",
  "Subscription",
  "Installments",
  "Phone & Data",
  "Family Transfer",
  "Health",
  "Entertainment",
  "Education",
  "Savings & Investment",
  "Others",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Side Income", "Others"] as const;

export const TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  "Salary",
  "Side Income",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const CATEGORIES_BY_TYPE = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
} as const;

export type TransactionType = keyof typeof CATEGORIES_BY_TYPE;

// Written the way users describe the spending, so the models map local words onto the right category.
const CATEGORY_EXAMPLES: Record<TransactionCategory, string> = {
  Food: "meals, groceries, snacks, coffee, drinks",
  Transportation: "fuel, parking, toll, ojek online, train, bus",
  Housing: "rent, kos, electricity, water, home internet",
  Shopping: "clothes, gadgets, household items, online shopping",
  Subscription: "streaming, music, apps, gym membership",
  Installments: "cicilan, paylater, loan or credit card payments",
  "Phone & Data": "pulsa, mobile data packages",
  "Family Transfer": "money sent to parents or family",
  Health: "doctor, medicine, BPJS, insurance",
  Entertainment: "movies, concerts, games, hobbies, hanging out",
  Education: "courses, books, tuition",
  "Savings & Investment":
    "money moved to savings, emergency fund, deposits, investments",
  Others: "anything that fits no other category",
  Salary: "monthly salary, bonus, THR",
  "Side Income": "freelance, side business, selling items",
};

export function isTransactionCategory(
  value: string,
): value is TransactionCategory {
  return (TRANSACTION_CATEGORIES as readonly string[]).includes(value);
}

export function isCategoryOfType(
  category: string,
  type: TransactionType,
): boolean {
  return (CATEGORIES_BY_TYPE[type] as readonly string[]).includes(category);
}

// One line per type, e.g. "- expense: 'Food' (meals, ...), ...", for the wizard and advisor prompts.
export function formatCategoriesForPrompt(): string {
  return (["expense", "income"] as const)
    .map((type) => {
      const categories: readonly TransactionCategory[] =
        CATEGORIES_BY_TYPE[type];
      const described = categories.map(
        (category) => `'${category}' (${CATEGORY_EXAMPLES[category]})`,
      );
      return `- ${type}: ${described.join(", ")}`;
    })
    .join("\n");
}
