// Values must match the CHECK constraints in migrations/007-business-profile.sql.
export const BUSINESS_TYPE_VALUES = [
  "food_stall",
  "grocery",
  "souvenir_craft",
  "services",
  "other",
] as const;

export const REGENCY_VALUES = [
  "badung",
  "bangli",
  "buleleng",
  "denpasar",
  "gianyar",
  "jembrana",
  "karangasem",
  "klungkung",
  "tabanan",
] as const;

export const TOURIST_DEPENDENCE_VALUES = ["high", "partial", "none"] as const;

export type BusinessType = (typeof BUSINESS_TYPE_VALUES)[number];
export type Regency = (typeof REGENCY_VALUES)[number];
export type TouristDependence = (typeof TOURIST_DEPENDENCE_VALUES)[number];

// English names for the Advisor prompt; the UI shows the "businessProfile" messages.
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  food_stall: "Food stall or restaurant",
  grocery: "Grocery or small shop",
  souvenir_craft: "Souvenirs or crafts",
  services: "Services",
  other: "Other",
};

export const REGENCY_LABELS: Record<Regency, string> = {
  badung: "Badung",
  bangli: "Bangli",
  buleleng: "Buleleng",
  denpasar: "Denpasar",
  gianyar: "Gianyar",
  jembrana: "Jembrana",
  karangasem: "Karangasem",
  klungkung: "Klungkung",
  tabanan: "Tabanan",
};

export const TOURIST_DEPENDENCE_LABELS: Record<TouristDependence, string> = {
  high: "Mostly tourists",
  partial: "A mix of tourists and locals",
  none: "Mostly locals",
};
