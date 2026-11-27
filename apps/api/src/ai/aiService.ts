import OpenAI from "openai";
import {
  buildGuardedPrompt,
  detectPromptInjectionSignals,
  type TicketContextInput,
} from "./promptGuard";
import { maskPii } from "./piiMasker";
import { checkContentModeration } from "./moderation";
import {
  CategoriseTicketSchema,
  parseAndValidateJson,
  SuggestReplySchema,
  type CategoriseTicketOutput,
  type SuggestReplyOutput,
} from "./aiSchemas";
import { getOpenAI } from "./openaiClient";
import {
  AiInputError,
  AiInvalidOutputError,
  AiNotConfiguredError,
  AiProviderError,
} from "./errors";
import { recordAiCall, type AiUsage } from "./usage";
import { categorizeOutputSchema, type CategorizeSuggestion } from "./schemas";
import {
  REPLY_TONE_INSTRUCTIONS,
  SUGGEST_REPLY_PROMPT,
  buildSuggestReplyUserMessage,
} from "./prompts/suggest-reply.v1";
import { CATEGORIZE_PROMPT, buildCategorizeUserMessage } from "./prompts/categorize.v1";
import type { AiCallMeta, CategorizeInput, ReplyContext, ReplyTone } from "./types";

export const MANUAL_FALLBACK_MESSAGE = "AI unavailable — reply manually.";

export interface AiCallResult<T> {
  ok: boolean;
  fallback: boolean;
  message: string;
  data: T | null;
  meta: {
    model: string;
    latencyMs: number;
    injectionSignalsDetected: number;
    piiRedactions: number;
    errorReason?: string;
  };
}

export interface AiCompletionTransport {
  createChatCompletion(params: {
    model: string;
    system: string;
    user: string;
    timeoutMs: number;
  }): Promise<string | null>;
}

export function createOpenAiTransport(client: OpenAI): AiCompletionTransport {
  return {
    async createChatCompletion({ model, system, user, timeoutMs }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await client.chat.completions.create(
          {
            model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          },
          { signal: controller.signal }
        );
        return response.choices?.[0]?.message?.content ?? null;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createAiService(deps: {
  transport: AiCompletionTransport;
  model?: string;
  timeoutMs?: number;
}) {
  const model = deps.model ?? process.env.OPENAI_MODEL ?? "gemini-2.5-flash";
  const timeoutMs = deps.timeoutMs ?? Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 8000);

  async function runGuardrailedTask<T>(
    input: TicketContextInput,
    taskInstruction: string,
    schema: typeof SuggestReplySchema | typeof CategoriseTicketSchema
  ): Promise<AiCallResult<T>> {
    const startMs = Date.now();
    const combinedText = [
      input.subject,
      input.body,
      ...(input.recentComments ?? []).map((c) => c.content),
    ].join("\n");

    const moderation = checkContentModeration(combinedText);
    if (!moderation.allowed) {
      return {
        ok: false,
        fallback: true,
        message: MANUAL_FALLBACK_MESSAGE,
        data: null,
        meta: {
          model,
          latencyMs: Date.now() - startMs,
          injectionSignalsDetected: 0,
          piiRedactions: 0,
          errorReason: moderation.reason ?? "MODERATION_BLOCKED",
        },
      };
    }

    const injectionSignals = detectPromptInjectionSignals(combinedText);
    const maskedSubject = maskPii(input.subject);
    const maskedBody = maskPii(input.body);
    const maskedComments = (input.recentComments ?? []).map((c) => {
      const m = maskPii(c.content);
      return { authorRole: c.authorRole, content: m.maskedText, count: m.maskedCounts };
    });

    const totalPiiRedactions =
      maskedSubject.maskedCounts.emails +
      maskedSubject.maskedCounts.phones +
      maskedSubject.maskedCounts.cardsOrIds +
      maskedBody.maskedCounts.emails +
      maskedBody.maskedCounts.phones +
      maskedBody.maskedCounts.cardsOrIds +
      maskedComments.reduce(
        (acc, item) => acc + item.count.emails + item.count.phones + item.count.cardsOrIds,
        0
      );

    const guarded = buildGuardedPrompt(
      {
        ticketId: input.ticketId,
        subject: maskedSubject.maskedText,
        body: maskedBody.maskedText,
        recentComments: maskedComments.map(({ authorRole, content }) => ({
          authorRole,
          content,
        })),
      },
      taskInstruction
    );

    try {
      const rawOutput = await deps.transport.createChatCompletion({
        model,
        system: guarded.systemInstructions,
        user: guarded.untrustedUserContent,
        timeoutMs,
      });

      const validated = parseAndValidateJson<T>(rawOutput, schema as never);
      if (!validated.ok) {
        return {
          ok: false,
          fallback: true,
          message: MANUAL_FALLBACK_MESSAGE,
          data: null,
          meta: {
            model,
            latencyMs: Date.now() - startMs,
            injectionSignalsDetected: injectionSignals.length,
            piiRedactions: totalPiiRedactions,
            errorReason: validated.reason,
          },
        };
      }

      return {
        ok: true,
        fallback: false,
        message: "OK",
        data: validated.data,
        meta: {
          model,
          latencyMs: Date.now() - startMs,
          injectionSignalsDetected: injectionSignals.length,
          piiRedactions: totalPiiRedactions,
        },
      };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        fallback: true,
        message: MANUAL_FALLBACK_MESSAGE,
        data: null,
        meta: {
          model,
          latencyMs: Date.now() - startMs,
          injectionSignalsDetected: injectionSignals.length,
          piiRedactions: totalPiiRedactions,
          errorReason: isAbort ? "AI_REQUEST_TIMEOUT" : "AI_PROVIDER_ERROR",
        },
      };
    }
  }

  return {
    suggestReply(input: TicketContextInput): Promise<AiCallResult<SuggestReplyOutput>> {
      return runGuardrailedTask<SuggestReplyOutput>(
        input,
        'Draft a polite, helpful internal agent reply suggestion. Return JSON ONLY: {"suggestedReply":"...","confidence":0.0,"requiresHumanReview":true}',
        SuggestReplySchema
      );
    },

    categoriseTicket(input: TicketContextInput): Promise<AiCallResult<CategoriseTicketOutput>> {
      return runGuardrailedTask<CategoriseTicketOutput>(
        input,
        'Classify the ticket into category (BILLING | TECHNICAL | ACCOUNT | FEATURE_REQUEST | GENERAL) and priority (LOW | MEDIUM | HIGH | URGENT). Return JSON ONLY: {"category":"GENERAL","priority":"MEDIUM","rationale":"...","confidence":0.0}',
        CategoriseTicketSchema
      );
    },
  };
}

function safeDiagnostic(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 100 || !/^[a-zA-Z0-9_.-]+$/.test(value)) {
    return undefined;
  }
  return value;
}

function providerStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("status" in err)) return undefined;
  const status = err.status;
  return typeof status === "number" ? status : undefined;
}

function logProviderFailure(err: unknown, status?: number): void {
  const details = typeof err === "object" && err !== null
    ? err as { code?: unknown; requestID?: unknown; name?: unknown }
    : {};
  const providerCode = safeDiagnostic(details.code);
  const requestId = safeDiagnostic(details.requestID);
  const errorType = safeDiagnostic(details.name);
  if (
    status === undefined &&
    !providerCode &&
    !requestId &&
    (!errorType || errorType === "Error" || errorType === "AiProviderError")
  ) {
    return;
  }

  console.error(JSON.stringify({
    event: "ai_provider_error",
    status,
    providerCode,
    requestId,
    errorType,
  }));
}

function toAiError(err: unknown): Error {
  if (
    err instanceof AiNotConfiguredError ||
    err instanceof AiInputError ||
    err instanceof AiInvalidOutputError
  ) {
    return err;
  }
  const status = providerStatus(err);
  logProviderFailure(err, status);
  if (err instanceof AiProviderError) return err;
  return new AiProviderError("AI provider request failed", status);
}

export async function* streamSuggestedReply(
  ctx: ReplyContext,
  meta: AiCallMeta,
  signal?: AbortSignal,
  tone: ReplyTone = "professional",
): AsyncGenerator<string, void, void> {
  const hasContent =
    ctx.ticket.title.trim() !== "" || ctx.ticket.description.trim() !== "" || ctx.comments.length > 0;
  if (!hasContent) throw new AiInputError("This ticket has no content to reply to.");

  const { client, model } = getOpenAI();
  const startedAt = Date.now();
  let usage: AiUsage;
  let status: "ok" | "error" = "ok";
  let produced = false;

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        max_tokens: 600,
        messages: [
          { role: "system", content: `${SUGGEST_REPLY_PROMPT.system}\n${REPLY_TONE_INSTRUCTIONS[tone]}` },
          { role: "user", content: buildSuggestReplyUserMessage(ctx) },
        ],
      },
      { signal },
    );

    for await (const chunk of stream) {
      if (chunk.usage) usage = chunk.usage;
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        produced = true;
        yield text;
      }
    }
    if (!produced) throw new AiProviderError("AI returned an empty response");
  } catch (err) {
    status = "error";
    throw toAiError(err);
  } finally {
    recordAiCall({
      feature: "suggest-reply",
      promptVersion: SUGGEST_REPLY_PROMPT.version,
      model,
      ...meta,
      status,
      startedAt,
      usage,
    });
  }
}

export async function categorizeTicket(
  input: CategorizeInput,
  meta: AiCallMeta,
): Promise<CategorizeSuggestion> {
  if (input.title.trim() === "" && input.description.trim() === "") {
    throw new AiInputError("This ticket has no content to classify.");
  }

  const { client, model } = getOpenAI();
  const startedAt = Date.now();
  let usage: AiUsage;
  let status: "ok" | "error" | "invalid_output" = "ok";

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      max_tokens: 300,
      messages: [
        { role: "system", content: CATEGORIZE_PROMPT.system },
        { role: "user", content: buildCategorizeUserMessage(input) },
      ],
    });
    usage = completion.usage;

    const raw = completion.choices[0]?.message?.content;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw ?? "");
    } catch {
      throw new AiInvalidOutputError("output is not valid JSON");
    }

    const result = categorizeOutputSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".") || "root"}:${i.code}`).join(", ");
      throw new AiInvalidOutputError(`schema validation failed (${issues})`);
    }
    return result.data;
  } catch (err) {
    status = err instanceof AiInvalidOutputError ? "invalid_output" : "error";
    throw toAiError(err);
  } finally {
    recordAiCall({
      feature: "categorize",
      promptVersion: CATEGORIZE_PROMPT.version,
      model,
      ...meta,
      status,
      startedAt,
      usage,
    });
  }
}
