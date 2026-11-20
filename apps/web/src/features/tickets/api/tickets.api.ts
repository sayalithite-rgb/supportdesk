import { apiRequest, apiRequestWithMeta } from '../../../lib/api-client'
import type {
  PageMeta,
  Ticket,
  TicketComment,
  TicketListParams,
  TicketStatus,
} from '../types'
import type { CreateCommentInput, CreateTicketInput } from '../schemas'

export function toQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

// ⚠️ Query param ke naam (page, pageSize, status, priority) controller se confirm karo
export function listTickets(params: TicketListParams) {
  return apiRequestWithMeta<Ticket[], PageMeta>(`/tickets${toQuery(params)}`)
}

export function getTicket(id: string) {
  return apiRequest<Ticket>(`/tickets/${id}`)
}

export function createTicket(input: CreateTicketInput) {
  return apiRequest<Ticket>('/tickets', { method: 'POST', body: input })
}

export function updateTicketStatus(id: string, status: TicketStatus) {
  return apiRequest<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: { status } })
}

// ⚠️ Comments ka asli path Step 0.4 se confirm karo
export function listComments(ticketId: string) {
  return apiRequest<TicketComment[]>(`/tickets/${ticketId}/comments`)
}

export function addComment(ticketId: string, input: CreateCommentInput) {
  return apiRequest<TicketComment>(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: input,
  })
}