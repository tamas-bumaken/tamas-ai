import messages from "../../messages/en.json";
import { formats } from "./formats";
import { Locale } from "./routing";

// English is the source of truth for message keys; messages.test.ts keeps id.json in step.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
