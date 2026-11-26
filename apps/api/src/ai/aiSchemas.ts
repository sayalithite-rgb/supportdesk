import { z } from "zod";

export const SUPPORT_CATEGORIES = [
  "BILLING",
  "TECHNICAL",
  "ACCOUNT",
  "FEATURE_REQUEST",
  "GENERAL",
] as const;

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const SuggestReplySchema = z
  .object({
    suggestedReply: z
      .string()
      .trim()
      .min(10, "Suggested reply is too short")
      .max(1500, "Suggested reply exceeds max length"),
    confidence: z.number().min(0).max(1),
    requiresHumanReview: z.boolean().default(true),
  })
  .strict();

export const CategoriseTicketSchema = z
  .object({
    category: z.enum(SUPPORT_CATEGORIES),
    priority: z.enum(TICKET_PRIORITIES),
    rationale: z.string().trim().min(5).max(400),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type SuggestReplyOutput = z.infer<typeof SuggestReplySchema>;
export type CategoriseTicketOutput = z.infer<typeof CategoriseTicketSchema>;

export function parseAndValidateJson<T>(
  rawContent: string | null | undefined,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; reason: string } {
  if (!rawContent || rawContent.trim().length === 0) {
    return { ok: false, reason: "EMPTY_MODEL_RESPONSE" };
  }

  const cleaned = rawContent
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: "INVALID_JSON" };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      reason: `SCHEMA_VALIDATION_FAILED: ${result.error.issues
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ")}`,
    };
  }

  return { ok: true, data: result.data };
}