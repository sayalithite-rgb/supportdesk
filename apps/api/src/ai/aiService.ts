import { getOpenAI } from './openaiClient'
import {
  AiInputError,
  AiInvalidOutputError,
  AiNotConfiguredError,
  AiProviderError,
} from './errors'
import { recordAiCall, type AiUsage } from './usage'
import { categorizeOutputSchema, type CategorizeSuggestion } from './schemas'
import { SUGGEST_REPLY_PROMPT, buildSuggestReplyUserMessage } from './prompts/suggest-reply.v1'
import { CATEGORIZE_PROMPT, buildCategorizeUserMessage } from './prompts/categorize.v1'
import type { AiCallMeta, CategorizeInput, ReplyContext } from './types'

// OpenAI ke andar ki koi bhi error user ko seedha nahi dikhti, sirf safe AiProviderError
function safeDiagnostic(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 100 || !/^[a-zA-Z0-9_.-]+$/.test(value)) {
    return undefined
  }
  return value
}

function providerStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null || !('status' in err)) return undefined
  const status = err.status
  return typeof status === 'number' ? status : undefined
}

function logProviderFailure(err: unknown, status?: number): void {
  const details = typeof err === 'object' && err !== null
    ? err as { code?: unknown; requestID?: unknown; name?: unknown }
    : {}
  const providerCode = safeDiagnostic(details.code)
  const requestId = safeDiagnostic(details.requestID)
  const errorType = safeDiagnostic(details.name)
  if (
    status === undefined &&
    !providerCode &&
    !requestId &&
    (!errorType || errorType === 'Error' || errorType === 'AiProviderError')
  ) {
    return
  }

  console.error(JSON.stringify({
    event: 'ai_provider_error',
    status,
    providerCode,
    requestId,
    errorType,
  }))
}

function toAiError(err: unknown): Error {
  if (
    err instanceof AiNotConfiguredError ||
    err instanceof AiInputError ||
    err instanceof AiInvalidOutputError
  ) {
    return err
  }
  const status = providerStatus(err)
  logProviderFailure(err, status)
  if (err instanceof AiProviderError) return err
  return new AiProviderError('AI provider request failed', status)
}

/** Feature 1: reply draft, tukde-tukde mein (stream) */
export async function* streamSuggestedReply(
  ctx: ReplyContext,
  meta: AiCallMeta,
  signal?: AbortSignal,
): AsyncGenerator<string, void, void> {
  const hasContent =
    ctx.ticket.title.trim() !== '' || ctx.ticket.description.trim() !== '' || ctx.comments.length > 0
  if (!hasContent) throw new AiInputError('This ticket has no content to reply to.')

  const { client, model } = getOpenAI()
  const startedAt = Date.now()
  let usage: AiUsage
  let status: 'ok' | 'error' = 'ok'
  let produced = false

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SUGGEST_REPLY_PROMPT.system },
          { role: 'user', content: buildSuggestReplyUserMessage(ctx) },
        ],
      },
      { signal },
    )

    for await (const chunk of stream) {
      if (chunk.usage) usage = chunk.usage
      const text = chunk.choices[0]?.delta?.content
      if (text) {
        produced = true
        yield text
      }
    }
    if (!produced) throw new AiProviderError('AI returned an empty response')
  } catch (err) {
    status = 'error'
    throw toAiError(err)
  } finally {
    recordAiCall({
      feature: 'suggest-reply',
      promptVersion: SUGGEST_REPLY_PROMPT.version,
      model,
      ...meta,
      status,
      startedAt,
      usage,
    })
  }
}

/** Feature 2: category + priority, validate hoke hi wapas */
export async function categorizeTicket(
  input: CategorizeInput,
  meta: AiCallMeta,
): Promise<CategorizeSuggestion> {
  if (input.title.trim() === '' && input.description.trim() === '') {
    throw new AiInputError('This ticket has no content to classify.')
  }

  const { client, model } = getOpenAI()
  const startedAt = Date.now()
  let usage: AiUsage
  let status: 'ok' | 'error' | 'invalid_output' = 'ok'

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 300,
      messages: [
        { role: 'system', content: CATEGORIZE_PROMPT.system },
        { role: 'user', content: buildCategorizeUserMessage(input) },
      ],
    })
    usage = completion.usage

    const raw = completion.choices[0]?.message?.content
    let parsed: unknown
    try {
      parsed = JSON.parse(raw ?? '')
    } catch {
      throw new AiInvalidOutputError('output is not valid JSON')
    }

    const result = categorizeOutputSchema.safeParse(parsed)
    if (!result.success) {
      // Sirf field ka path aur error ka type, model ka text nahi
      const issues = result.error.issues.map((i) => `${i.path.join('.') || 'root'}:${i.code}`).join(', ')
      throw new AiInvalidOutputError(`schema validation failed (${issues})`)
    }
    return result.data
  } catch (err) {
    status = err instanceof AiInvalidOutputError ? 'invalid_output' : 'error'
    throw toAiError(err)
  } finally {
    recordAiCall({
      feature: 'categorize',
      promptVersion: CATEGORIZE_PROMPT.version,
      model,
      ...meta,
      status,
      startedAt,
      usage,
    })
  }
}