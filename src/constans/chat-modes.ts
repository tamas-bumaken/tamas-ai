import { ChatMode } from "@/validations/chatbot-validations";
import { GlobeIcon, LucideIcon, UserRoundIcon } from "lucide-react";

// Chosen with the switch in the Advisor drawer and saved on the profile; this is how the app shows each mode.
// Labels, descriptions and the starter questions live in the "chatModes" messages; the questions are sent as-is when
// tapped, so they are written the way users actually ask.
type ChatModeOption = {
  Icon: LucideIcon;
  suggestionKeys: readonly ("q1" | "q2" | "q3")[];
};

const SUGGESTION_KEYS = ["q1", "q2", "q3"] as const;

export const CHAT_MODES: Record<ChatMode, ChatModeOption> = {
  personal: { Icon: UserRoundIcon, suggestionKeys: SUGGESTION_KEYS },
  general: { Icon: GlobeIcon, suggestionKeys: SUGGESTION_KEYS },
};
