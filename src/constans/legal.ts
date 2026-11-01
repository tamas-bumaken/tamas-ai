// Shared by the Privacy Policy and the Terms of Service, so the two always name the same operator.
export const LEGAL_OPERATOR = "Tamas Team";

// Set before the beta opens (see "Prasyarat sebelum beta" in docs/tasks/phase-1.md); UU PDP requires a contact channel.
export const LEGAL_CONTACT_EMAIL: string | null = null;

// Move this forward whenever either page changes in substance. Month is zero-based: 10 is November.
export const LEGAL_LAST_UPDATED = new Date(Date.UTC(2026, 10, 1));
