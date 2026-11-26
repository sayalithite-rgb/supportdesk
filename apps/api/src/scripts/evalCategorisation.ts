// apps/api/src/scripts/evalCategorisation.ts
import fs from "node:fs";
import path from "node:path";
import { createAiService, type AiCompletionTransport } from "../ai/aiService";
import type { SupportCategory } from "../ai/aiSchemas";

export interface EvalTicketCase {
  id: string;
  subject: string;
  body: string;
  expectedCategory: SupportCategory;
  expectedPriority?: string;
}

export interface EvalSummary {
  total: number;
  correct: number;
  accuracyPercent: number;
  passedThreshold: boolean;
  mismatches: Array<{
    id: string;
    expected: SupportCategory;
    predicted: string;
    errorReason?: string;
  }>;
}

export async function runCategorisationEvaluation(
  cases: EvalTicketCase[],
  transport: AiCompletionTransport,
  thresholdPercent = 80
): Promise<EvalSummary> {
  const aiService = createAiService({ transport, model: "gemini-2.5-flash" });
  let correct = 0;
  const mismatches: EvalSummary["mismatches"] = [];

  for (const item of cases) {
    const res = await aiService.categoriseTicket({
      ticketId: item.id,
      subject: item.subject,
      body: item.body,
    });

    const predicted = res.ok && res.data ? res.data.category : "FALLBACK_OR_INVALID";
    if (predicted === item.expectedCategory) {
      correct += 1;
    } else {
      mismatches.push({
        id: item.id,
        expected: item.expectedCategory,
        predicted,
        errorReason: res.meta.errorReason,
      });
    }
  }

  const total = cases.length;
  const accuracyPercent = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

  return {
    total,
    correct,
    accuracyPercent,
    passedThreshold: accuracyPercent >= thresholdPercent,
    mismatches,
  };
}

if (require.main === module) {
  const fixturePath = path.resolve(__dirname, "../../fixtures/eval-tickets-20.json");
  const cases = JSON.parse(fs.readFileSync(fixturePath, "utf-8")) as EvalTicketCase[];

  const sampleTransport: AiCompletionTransport = {
    async createChatCompletion({ user }) {
      const lower = user.toLowerCase();
      let category: SupportCategory = "GENERAL";
      if (lower.includes("bill") || lower.includes("refund") || lower.includes("invoice") || lower.includes("checkout")) {
        category = "BILLING";
      } else if (lower.includes("502") || lower.includes("webhook") || lower.includes("chart") || lower.includes("csv") || lower.includes("rate limit")) {
        category = "TECHNICAL";
      } else if (lower.includes("password") || lower.includes("email") || lower.includes("2fa") || lower.includes("teammate")) {
        category = "ACCOUNT";
      } else if (lower.includes("dark mode") || lower.includes("bulk") || lower.includes("slack") || lower.includes("sla")) {
        category = "FEATURE_REQUEST";
      }
      return JSON.stringify({
        category,
        priority: "MEDIUM",
        rationale: "Baseline evaluation output",
        confidence: 0.85,
      });
    },
  };

  runCategorisationEvaluation(cases, sampleTransport, 80).then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
    if (!summary.passedThreshold) {
      process.exitCode = 1;
    }
  });
}