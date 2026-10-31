import {
  BUSINESS_TYPE_LABELS,
  REGENCY_LABELS,
  TOURIST_DEPENDENCE_LABELS,
} from "@/constans/business-profile";
import { Profile } from "@/types/profile";

// The app records and shows every amount in rupiah.
const CURRENCY = "IDR";

const NOT_PROVIDED = "not provided";

// Built on the server from the database, never from the request body, so a client cannot rewrite who the model thinks it is advising.
export function buildUserContext(profile: Profile): string {
  const lines = [
    `- Business name: ${profile.business_name ?? NOT_PROVIDED}`,
    `- Business type: ${
      profile.business_type === null
        ? NOT_PROVIDED
        : BUSINESS_TYPE_LABELS[profile.business_type]
    }`,
    `- Location: ${
      profile.regency === null
        ? NOT_PROVIDED
        : `${REGENCY_LABELS[profile.regency]}, Bali`
    }`,
    `- Reliance on tourists: ${
      profile.tourist_dependence === null
        ? NOT_PROVIDED
        : TOURIST_DEPENDENCE_LABELS[profile.tourist_dependence]
    }`,
    `- Currency: ${CURRENCY}`,
  ];

  return `<user_profile>\n${lines.join("\n")}\n</user_profile>`;
}
