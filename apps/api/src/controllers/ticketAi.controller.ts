import type { NextFunction, Request, Response } from 'express'
import {
  AiInputError,
  AiInvalidOutputError,
  AiNotConfiguredError,
  AiProviderError,
} from '../ai/errors'
import { TicketNotFoundError, ticketAiService } from '../services/ticketAi.service'
import { idParamSchema } from '../validation/tickets.validation'
import { z } from 'zod'

const MANUAL_FALLBACK_MESSAGE = 'AI unavailable — reply manually.'

const suggestReplyBodySchema = z.object({
  tone: z.enum(['professional', 'empathetic', 'concise']).default('professional'),
})

type AuthedRequest = Request & { user?: { id?: string } } // ⚠️ tickets.controller.ts jaise user padhte ho wahi karo

const getUserId = (req: Request) => (req as AuthedRequest).user?.id

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ data: null, error: { code, message }, meta: {} })
}

function sendFallback(res: Response, code: string, fallbackMessage = MANUAL_FALLBACK_MESSAGE) {
  res.status(200).json({
    data: null,
    fallback: fallbackMessage,
    error: { code, message: fallbackMessage },
    meta: { manualFallback: true },
  })
}

function isBlockedOrModerationError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = `${err.name} ${err.message}`.toLowerCase()
  return (
    msg.includes('moderation') ||
    msg.includes('blocked') ||
    msg.includes('prompt_injection') ||
    msg.includes('unsafe')
  )
}

function isTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = `${err.name} ${err.message}`.toLowerCase()
  return err.name === 'AbortError' || msg.includes('timeout') || msg.includes('timed out')
}

function providerMessage(status?: number): string {
  if (status === 401) return 'The AI provider rejected the API key. Check that it is valid for the configured provider.'
  if (status === 403) return 'The AI provider denied access. Check the key permissions and model access.'
  if (status === 404) return 'The configured AI model or API endpoint was not found. Check OPENAI_MODEL and OPENAI_BASE_URL.'
  if (status === 429) return 'The AI provider quota or rate limit was reached. Check the provider account limits.'
  if (status === 400) return 'The AI provider rejected the request. Check that the configured model supports this request.'
  if (status !== undefined && status >= 500) return 'The AI provider is temporarily unavailable. Please try again.'
  return 'The AI provider is unavailable. Please try again.'
}

function publicMessage(err: unknown): string {
  if (isBlockedOrModerationError(err)) return MANUAL_FALLBACK_MESSAGE
  if (isTimeoutError(err)) return MANUAL_FALLBACK_MESSAGE
  if (err instanceof AiProviderError) return providerMessage(err.status)
  return 'The AI could not finish the reply. Please try again.'
}

function handleAiError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof AiNotConfiguredError)
    return sendError(res, 503, 'AI_NOT_CONFIGURED', 'AI features are not available right now.')
  if (err instanceof TicketNotFoundError) return sendError(res, 404, 'TICKET_NOT_FOUND', 'Ticket not found.')
  if (err instanceof AiInputError) return sendError(res, 422, 'AI_INPUT_EMPTY', err.message)
  if (isBlockedOrModerationError(err))
    return sendFallback(res, 'AI_CONTENT_BLOCKED', MANUAL_FALLBACK_MESSAGE)
  if (isTimeoutError(err))
    return sendFallback(res, 'AI_TIMEOUT', MANUAL_FALLBACK_MESSAGE)
  if (err instanceof AiInvalidOutputError)
    return sendFallback(res, 'AI_INVALID_OUTPUT', MANUAL_FALLBACK_MESSAGE)
  if (err instanceof AiProviderError)
    return sendFallback(res, 'AI_PROVIDER_ERROR', MANUAL_FALLBACK_MESSAGE)
  return next(err)
}

export const ticketAiController = {
  async suggestReply(req: Request, res: Response, next: NextFunction) {
    const abort = new AbortController()
    const streamTimeoutMs = Number(process.env.AI_STREAM_TIMEOUT_MS ?? 15_000)
    const streamTimer = setTimeout(() => {
      if (!abort.signal.aborted) abort.abort(new Error('AI_STREAM_TIMEOUT'))
    }, streamTimeoutMs)

    res.on('close', () => {
      clearTimeout(streamTimer)
      if (!res.writableEnded) abort.abort() // user ne tab band kiya
    })

    try {
      const { id } = idParamSchema.parse(req.params)
      const { tone } = suggestReplyBodySchema.parse(req.body ?? {})
      const stream = await ticketAiService.openSuggestReply(id, getUserId(req), abort.signal, tone)
      const iterator = stream[Symbol.asyncIterator]()
      const first = await iterator.next() // provider ke errors yahin normal HTTP error ban jate hain

      if (first.done || !first.value || String(first.value).trim().length === 0) {
        clearTimeout(streamTimer)
        return sendFallback(res, 'AI_EMPTY_STREAM', MANUAL_FALLBACK_MESSAGE)
      }

      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()

      const send = (event: object) => {
        if (!res.writableEnded && !res.destroyed) {
          res.write(`data: ${JSON.stringify(event)}\n\n`)
        }
      }

      let emittedChunks = 0
      try {
        let step: IteratorResult<string, void> = first
        while (!step.done) {
          if (abort.signal.aborted || res.destroyed) {
            throw new Error('AI_STREAM_INTERRUPTED')
          }
          if (typeof step.value === 'string' && step.value.length > 0) {
            emittedChunks += 1
            send({ type: 'delta', text: step.value })
          }
          step = await iterator.next()
        }

        if (emittedChunks === 0) {
          send({
            type: 'error',
            code: 'AI_EMPTY_STREAM',
            message: MANUAL_FALLBACK_MESSAGE,
            fallback: MANUAL_FALLBACK_MESSAGE,
          })
        } else {
          send({ type: 'done' })
        }
      } catch (err) {
        if (!res.writableEnded && !res.destroyed) {
          send({
            type: 'error',
            code: isTimeoutError(err) ? 'AI_STREAM_TIMEOUT' : 'AI_STREAM_INTERRUPTED',
            message: publicMessage(err),
            fallback: MANUAL_FALLBACK_MESSAGE,
          })
        }
      } finally {
        clearTimeout(streamTimer)
        if (!res.writableEnded) res.end()
      }
    } catch (err) {
      clearTimeout(streamTimer)
      handleAiError(err, res, next)
    }
  },

  async categorize(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params)
      const suggestion = await ticketAiService.categorize(id, getUserId(req))
      if (!suggestion) {
        return sendFallback(res, 'AI_INVALID_OUTPUT', MANUAL_FALLBACK_MESSAGE)
      }
      res.json({ data: suggestion, error: null, meta: {} })
    } catch (err) {
      handleAiError(err, res, next)
    }
  },
}