import { ChatMode } from "@/validations/chatbot-validations";
import { GlobeIcon, LucideIcon, UserRoundIcon } from "lucide-react";

// The mode follows the "Let AI Advisor use my data" setting in Profile (Phase 1 / 1.9); this is how the drawer shows it.
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
