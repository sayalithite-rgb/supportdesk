import type { NextFunction, Request, Response } from 'express'
import {
  AiInputError,
  AiInvalidOutputError,
  AiNotConfiguredError,
  AiProviderError,
} from '../ai/errors'
import { TicketNotFoundError, ticketAiService } from '../services/ticketAi.service'
import { idParamSchema } from '../validation/tickets.validation'

type AuthedRequest = Request & { user?: { id?: string } } // ⚠️ tickets.controller.ts jaise user padhte ho wahi karo

const getUserId = (req: Request) => (req as AuthedRequest).user?.id

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ data: null, error: { code, message }, meta: {} })
}

function publicMessage(err: unknown): string {
  if (err instanceof AiProviderError) return 'The AI provider is unavailable. Please try again.'
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
    return sendError(res, 502, 'AI_PROVIDER_ERROR', 'The AI provider is unavailable. Please try again.')
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
      const stream = await ticketAiService.openSuggestReply(id, getUserId(req), abort.signal)
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