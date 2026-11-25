import { apiRequest, apiStream, type StreamEvent } from '../../../lib/api-client'
import type { TicketPriority } from '../types'

export type CategorySuggestion = {
  category: string
  priority: TicketPriority
  reason?: string
}

export type ReplyTone = 'professional' | 'empathetic' | 'concise'

export function streamSuggestedReply(
  ticketId: string,
  tone: ReplyTone,
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
) {
  return apiStream(`/tickets/${ticketId}/ai/suggest-reply`, {
    method: 'POST',
    body: { tone },
    onEvent,
    signal,
  })
}

export function categorizeTicket(ticketId: string) {
  return apiRequest<CategorySuggestion>(`/tickets/${ticketId}/ai/categorize`, { method: 'POST' })
}