import { prisma } from '../repositories/prisma' // ⚠️ Step 1 ke grep se asli path
import { categorizeTicket, streamSuggestedReply } from '../ai/aiService'
import type { ReplyContext } from '../ai/types'

export class TicketNotFoundError extends Error {
  constructor() {
    super('Ticket not found')
    this.name = 'TicketNotFoundError'
  }
}

const MAX_COMMENTS = 10

async function loadTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { title: true, description: true, status: true, priority: true, category: true },
  })
  if (!ticket) throw new TicketNotFoundError()
  return ticket
}

async function loadReplyContext(ticketId: string): Promise<ReplyContext> {
  const ticket = await loadTicket(ticketId)
  const latest = await prisma.comment.findMany({
    where: { ticketId, isInternal: false },
    orderBy: { createdAt: 'desc' },
    take: MAX_COMMENTS,
    select: { body: true, author: { select: { role: true } } },
  })
  return {
    ticket,
    comments: latest.reverse().map((c) => ({ authorRole: String(c.author.role), body: c.body })),
  }
}

export const ticketAiService = {
  // Context pehle bante hain (not-found yahin pakda jata hai), phir stream ka generator wapas aata hai
  async openSuggestReply(ticketId: string, userId: string | undefined, signal?: AbortSignal) {
    const ctx = await loadReplyContext(ticketId)
    return streamSuggestedReply(ctx, { ticketId, userId }, signal)
  },

  async categorize(ticketId: string, userId: string | undefined) {
    const ticket = await loadTicket(ticketId)
    return categorizeTicket(
      { title: ticket.title, description: ticket.description },
      { ticketId, userId },
    )
  },
}