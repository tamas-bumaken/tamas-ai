import {
  addUsage,
  AiUsageTotals,
  createUsageTotals,
  finishAiRequest,
  isAiServiceBusy,
  startAiRequest,
} from "@/lib/ai-usage";
import { getCookieTranslations } from "@/i18n/server";
import { captureEvent } from "@/lib/analytics";
import { saveExchange } from "@/lib/advisor-history";
import { loadAdvisorMode } from "@/lib/advisor-settings";
import { getProfileForRequest } from "@/lib/auth";
import { getTodayInJakarta } from "@/lib/dates";
import { ai } from "@/lib/genai";
import { createClient } from "@/lib/supabase/server";
import { ChatStreamEvent } from "@/types/chat";
import { Profile } from "@/types/profile";
import {
  ChatMode,
  ChatRequest,
  chatRequestSchema,
} from "@/validations/chatbot-validations";
import {
  Content,
  FunctionCallingConfigMode,
  GenerateContentResponseUsageMetadata,
  Part,
  ThinkingLevel,
} from "@google/genai";
import {
  PERSONAL_TOOL_DECLARATIONS,
  PersonalToolContext,
  runPersonalTool,
} from "./personal-tools";
import { buildSystemInstruction } from "./system-instruction";

const CHAT_MODEL = "gemini-3.6-flash";

// Bounds the Gemini calls one message can trigger; the round after the last one must answer in text.
const MAX_TOOL_ROUNDS = 3;

async function* streamChat({
  messages,
  systemInstruction,
  toolContext,
  abortSignal,
  usage,
}: {
  messages: ChatRequest["messages"];
  systemInstruction: string;
  // Present only in personal mode; general mode never gets tools, so it cannot read user data.
  toolContext: PersonalToolContext | null;
  abortSignal: AbortSignal;
  // Token counts of every Gemini call are added here, also when the stream fails or is aborted.
  usage: AiUsageTotals;
}): AsyncGenerator<ChatStreamEvent> {
  const contents: Content[] = messages.map(({ role, text }) => ({
    role,
    parts: [{ text }],
  }));

  for (let round = 0; ; round++) {
    const response = await ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents,
      config: {
        abortSignal,
        systemInstruction,

        //sampling params
        //default dari gemini adalah : temperature : 1.0
        temperature: 0.2,
        // topK: 4,
        // topP: 0.1,

        //output control
        maxOutputTokens: 1024,
        // "###" is omitted on purpose: the instruction asks for Markdown, so it would cut off headings.
        stopSequences: ["\n\n\n", "User:", "Pengguna:"],

        //repetion pinalties
        // presencePenalty:1.5,
        // frequencyPenalty:1.5,

        // Chosen by the server, not the user (Phase 0 / 0.10). Gemini 3 cannot fully disable thinking;
        // MINIMAL is the fastest and cheapest level, and its thoughts are not sent to the client.
        thinkingConfig: {
          includeThoughts: false,
          thinkingLevel: ThinkingLevel.MINIMAL,
        },

        ...(toolContext && {
          tools: [{ functionDeclarations: PERSONAL_TOOL_DECLARATIONS }],
          toolConfig: {
            functionCallingConfig: {
              mode:
                round < MAX_TOOL_ROUNDS
                  ? FunctionCallingConfigMode.AUTO
                  : FunctionCallingConfigMode.NONE,
            },
          },
        }),
      },
    });

    // Every part is kept, including empty ones: Gemini 3 rejects a follow-up turn whose thought signatures were dropped.
    const modelParts: Part[] = [];
    // Each chunk carries the running totals of this call, so only the latest one counts.
    let callUsage: GenerateContentResponseUsageMetadata | undefined;

    try {
      for await (const chunk of response) {
        callUsage = chunk.usageMetadata ?? callUsage;

        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          modelParts.push(part);

          if (part.text && !part.thought) {
            yield { type: "answer", text: part.text };
          }
        }
      }
    } finally {
      addUsage(usage, callUsage);
    }

    const functionCalls = modelParts.flatMap((part) =>
      part.functionCall ? [part.functionCall] : [],
    );

    if (!toolContext || functionCalls.length === 0) return;

    const functionResponses = await Promise.all(
      functionCalls.map((call) => runPersonalTool(call, toolContext)),
    );

    contents.push(
      { role: "model", parts: modelParts },
      {
        role: "user",
        parts: functionResponses.map((functionResponse) => ({
          functionResponse,
        })),
      },
    );
  }
}

export async function POST(request: Request) {
  // Read up front: the stream below runs after the response has started.
  const t = await getCookieTranslations("apiErrors");
  let profile: Profile | null;

  try {
    profile = await getProfileForRequest();
  } catch (error) {
    console.error("[api/chat] profile lookup failed", error);
    return Response.json({ error: t("profileLoadFailed") }, { status: 500 });
  }

  // Checked before the body: every request past this point spends Gemini tokens.
  if (!profile) {
    return Response.json({ error: t("unauthorized") }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: t("invalidRequest") }, { status: 400 });
  }

  // Created while the request is still in scope, since the tools and the usage write run after the response has started streaming.
  const supabase = await createClient();

  // Follows the saved mode, never the request. If it cannot be read, answer without the user's data rather than with it.
  let mode: ChatMode;
  try {
    mode = await loadAdvisorMode(supabase, profile.id);
  } catch (error) {
    console.error("[api/chat] advisor setting lookup failed", error);
    mode = "general";
  }

  // After validation, so a malformed body does not use up the user's quota.
  const quota = await startAiRequest(supabase, "chat", CHAT_MODEL);

  if (!quota.allowed) {
    return Response.json({ error: quota.message }, { status: quota.status });
  }

  const { messages, conversationId } = parsed.data;
  captureEvent(profile.id, "advisor_message_sent", { mode });
  const systemInstruction = buildSystemInstruction(
    mode === "personal" ? { mode, profile } : { mode },
  );
  const toolContext: PersonalToolContext | null =
    mode === "personal" ? { supabase, today: getTodayInJakarta() } : null;
  const usage = createUsageTotals();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        let answer = "";
        for await (const event of streamChat({
          messages,
          systemInstruction,
          toolContext,
          abortSignal: request.signal,
          usage,
        })) {
          if (event.type === "answer") answer += event.text;
          send(event);
        }

        // Only finished answers are kept (Phase 1 / 1.8); a failed or aborted exchange leaves the history untouched.
        if (answer.trim()) {
          try {
            await saveExchange(supabase, {
              conversationId,
              firstMessage: messages[0].text,
              question: messages[messages.length - 1].text,
              answer,
              mode,
            });
          } catch (error) {
            // The user already has the answer on screen; only the history misses it.
            console.error("[api/chat] failed to save the exchange", error);
          }
        }
      } catch (error) {
        // The client is gone, so there is no one left to report the error to.
        if (!request.signal.aborted) {
          console.error("[api/chat] stream failed", error);
          send({
            type: "error",
            message: isAiServiceBusy(error) ? t("busy") : t("chatFailed"),
          });
        }
      } finally {
        await finishAiRequest(supabase, quota.requestId, usage);
      }

      // An aborted request has no reader left, so the stream is only closed for a client still listening.
      if (!request.signal.aborted) controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
