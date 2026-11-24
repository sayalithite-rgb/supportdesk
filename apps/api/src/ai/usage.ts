import { env } from '../config/env'

export type AiFeature = 'suggest-reply' | 'categorize'
export type AiUsage =
  | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  | null
  | undefined

export function estimateCostUsd(usage: AiUsage, inputPer1M?: number, outputPer1M?: number): number | null {
  if (!usage || usage.prompt_tokens === undefined || usage.completion_tokens === undefined) return null
  if (inputPer1M === undefined || outputPer1M === undefined) return null
  const cost =
    (usage.prompt_tokens / 1_000_000) * inputPer1M + (usage.completion_tokens / 1_000_000) * outputPer1M
  return Number(cost.toFixed(6))
}

export type AiCallParams = {
  feature: AiFeature
  promptVersion: string
  model: string
  ticketId: string
  userId?: string
  status: 'ok' | 'error' | 'invalid_output'
  startedAt: number
  usage: AiUsage
}

export function recordAiCall(p: AiCallParams): void {
  const costUsd = estimateCostUsd(p.usage, env.OPENAI_INPUT_COST_PER_1M_USD, env.OPENAI_OUTPUT_COST_PER_1M_USD)
  // ⚠️ Project ka logger ho to console.info ki jagah wahi use karo
  console.info(
    JSON.stringify({
      event: 'ai_call',
      feature: p.feature,
      promptVersion: p.promptVersion,
      model: p.model,
      ticketId: p.ticketId,
      userId: p.userId ?? null,
      status: p.status,
      latencyMs: Date.now() - p.startedAt,
      promptTokens: p.usage?.prompt_tokens ?? null,
      completionTokens: p.usage?.completion_tokens ?? null,
      totalTokens: p.usage?.total_tokens ?? null,
      costUsd, // null = usage ya price config missing, andaza nahi lagaya
    }),
  )
}