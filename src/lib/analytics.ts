import "server-only";

import { after } from "next/server";
import { PostHog } from "posthog-node";
import { ENVIRONMENT } from "@/config/environment";
import { Locale } from "@/i18n/routing";
import { AdvisorFeedback, ChatMode } from "@/validations/chatbot-validations";
import { TransactionSource } from "@/validations/transaction-validations";

type NoProperties = Record<string, never>;

// Product analytics events (Phase 0 / 0.7). Only ids and coarse attributes are sent:
// amounts, descriptions and profile answers never leave the app.
type AnalyticsEvents = {
  signed_up: { method: "email" | "google" };
  onboarding_completed: NoProperties;
  onboarding_skipped: NoProperties;
  transaction_created: {
    source: TransactionSource;
    transaction_id: string;
    // Quick entry only: whether the user changed the model's draft before saving (input quality metric).
    edited_in_preview?: boolean;
  };
  transaction_edited: { source: TransactionSource; transaction_id: string };
  advisor_message_sent: { mode: ChatMode };
  advisor_feedback: AdvisorFeedback;
  advisor_data_access_changed: { enabled: boolean };
  logging_insight_shown: NoProperties;
  locale_changed: { locale: Locale };
};

// Sent from the server so ad blockers cannot drop events. The distinct id is the Supabase user id.
// Runs after the response, so analytics never slows down or breaks the user's action.
export function captureEvent<E extends keyof AnalyticsEvents>(
  userId: string,
  event: E,
  properties: AnalyticsEvents[E],
): void {
  const { posthogProjectToken, posthogHost } = ENVIRONMENT;

  // Optional in local development: without a token the event is dropped.
  if (!posthogProjectToken || !posthogHost) return;

  after(async () => {
    // Request-scoped and unbatched, as PostHog recommends for short-lived serverless functions.
    const posthog = new PostHog(posthogProjectToken, {
      host: posthogHost,
      flushAt: 1,
      flushInterval: 0,
    });

    posthog.capture({ distinctId: userId, event, properties });

    try {
      await posthog.shutdown();
    } catch (error) {
      console.error("[analytics] failed to send event", event, error);
    }
  });
}
