// The single category list for the manual form, the wizard, the advisor and the landing page (decision D4).
// Values are stored in the database as-is; the UI shows their labels from the "categories" messages (D1).
// Mirrored by the transactions_category_check constraint (migrations/006): changing a list needs a new migration.

// Only these two groups count toward profit.
export const BUSINESS_INCOME_CATEGORIES = [
  "Sales",
  "Other Business Income",
] as const;

export const BUSINESS_EXPENSE_CATEGORIES = [
  "Raw Materials",
  "Staff Wages",
  "Rent & Utilities",
  "Transport & Delivery",
  "Marketing & Platform Fees",
  "Equipment",
  "Other Business Expense",
] as const;

// Money moving in or out of the business that is neither earned nor spent on running it.
export const OWNER_CAPITAL_CATEGORY = "Owner Capital";
export const LOAN_INSTALLMENTS_CATEGORY = "Loan Installments";
export const OWNER_WITHDRAWAL_CATEGORY = "Owner Withdrawal";
export const CEREMONY_CATEGORY = "Ceremony & Adat";

export const INCOME_CATEGORIES = [
  ...BUSINESS_INCOME_CATEGORIES,
  OWNER_CAPITAL_CATEGORY,
] as const;

export const EXPENSE_CATEGORIES = [
  ...BUSINESS_EXPENSE_CATEGORIES,
  LOAN_INSTALLMENTS_CATEGORY,
  OWNER_WITHDRAWAL_CATEGORY,
  CEREMONY_CATEGORY,
] as const;

export const TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const CATEGORIES_BY_TYPE = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
} as const;

export type TransactionType = keyof typeof CATEGORIES_BY_TYPE;

export type CategoryGroup =
  | "business_income"
  | "owner_capital"
  | "business_expense"
  | "loan_installments"
  | "owner_taken";

// Written the way owners describe the money, so the models map local words onto the right category.
const CATEGORY_EXAMPLES: Record<TransactionCategory, string> = {
  Sales: "selling goods or services, daily takings, jual, penjualan, omzet",
  "Other Business Income":
    "other money the business earned: rental, commission, tips, supplier refund",
  "Owner Capital":
    "money put into the business that was not earned: the owner's savings, a KUR or LPD loan disbursement, tambah modal",
  "Raw Materials":
    "ingredients, goods to resell and packaging: ayam, beras, minyak, stok barang, kemasan",
  "Staff Wages": "gaji karyawan, upah harian, staff pay",
  "Rent & Utilities": "sewa kios, listrik, air, gas, internet",
  "Transport & Delivery": "bensin, parkir, ongkir, kurir",
  "Marketing & Platform Fees":
    "iklan, promo, potongan GoFood, GrabFood or Shopee, biaya QRIS",
  Equipment: "kompor, etalase, kulkas, peralatan usaha",
  "Other Business Expense":
    "any other cost of running the business: izin, servis, perbaikan",
  "Loan Installments": "cicilan KUR, bayar pinjaman bank, koperasi or LPD",
  "Owner Withdrawal":
    "money the owner takes for the household or themselves: ambil uang, belanja rumah, uang sekolah, pulsa pribadi",
  "Ceremony & Adat":
    "ceremonial and customary costs: canang, banten, upakara, odalan, iuran banjar, sumbangan adat",
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

// Null for a value outside the lists; transactions_category_check keeps those out of the database.
export function getCategoryGroup(category: string): CategoryGroup | null {
  if ((BUSINESS_INCOME_CATEGORIES as readonly string[]).includes(category)) {
    return "business_income";
  }
  if ((BUSINESS_EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return "business_expense";
  }

  switch (category) {
    case OWNER_CAPITAL_CATEGORY:
      return "owner_capital";
    case LOAN_INSTALLMENTS_CATEGORY:
      return "loan_installments";
    case OWNER_WITHDRAWAL_CATEGORY:
    case CEREMONY_CATEGORY:
      return "owner_taken";
    default:
      return null;
  }
}

// One line per type, e.g. "- expense: 'Raw Materials' (ingredients, ...), ...", for the wizard and advisor prompts.
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
