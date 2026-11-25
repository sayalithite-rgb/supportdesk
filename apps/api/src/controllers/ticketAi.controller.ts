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

const suggestReplyBodySchema = z.object({
  tone: z.enum(['professional', 'empathetic', 'concise']).default('professional'),
})

type AuthedRequest = Request & { user?: { id?: string } } // ⚠️ tickets.controller.ts jaise user padhte ho wahi karo

const getUserId = (req: Request) => (req as AuthedRequest).user?.id

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ data: null, error: { code, message }, meta: {} })
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
  if (err instanceof AiProviderError) return providerMessage(err.status)
  return 'The AI could not finish the reply. Please try again.'
}

function handleAiError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof AiNotConfiguredError)
    return sendError(res, 503, 'AI_NOT_CONFIGURED', 'AI features are not available right now.')
  if (err instanceof TicketNotFoundError) return sendError(res, 404, 'TICKET_NOT_FOUND', 'Ticket not found.')
  if (err instanceof AiInputError) return sendError(res, 422, 'AI_INPUT_EMPTY', err.message)
  if (err instanceof AiInvalidOutputError)
    return sendError(res, 502, 'AI_INVALID_OUTPUT', 'The AI returned an unusable answer. Please try again.')
  if (err instanceof AiProviderError)
    return sendError(res, 502, 'AI_PROVIDER_ERROR', providerMessage(err.status))
  return next(err)
}

export const ticketAiController = {
  async suggestReply(req: Request, res: Response, next: NextFunction) {
    const abort = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) abort.abort() // user ne tab band kiya
    })

    try {
      const { id } = idParamSchema.parse(req.params)
      const { tone } = suggestReplyBodySchema.parse(req.body ?? {})
      const stream = await ticketAiService.openSuggestReply(id, getUserId(req), abort.signal, tone)
      const iterator = stream[Symbol.asyncIterator]()
      const first = await iterator.next() // provider ke errors yahin normal HTTP error ban jate hain

      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()

      const send = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`)
      try {
        let step = first
        while (!step.done) {
          send({ type: 'delta', text: step.value })
          step = await iterator.next()
        }
        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: publicMessage(err) })
      } finally {
        if (!res.writableEnded) res.end()
      }
    } catch (err) {
      handleAiError(err, res, next)
    }
  },

  async categorize(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params)
      const suggestion = await ticketAiService.categorize(id, getUserId(req))
      res.json({ data: suggestion, error: null, meta: {} })
    } catch (err) {
      handleAiError(err, res, next)
    }
  },
}