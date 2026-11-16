import { commentsRepository } from '../repositories/comments.repository';
import { ticketsRepository } from '../repositories/tickets.repository';
import { AppError } from '../utils/AppError';

export const commentsService = {
  async createComment(
    user: { id: string; role: string },
    ticketId: string,
    content: string,
    isInternal?: boolean
  ) {
    const ticket = await ticketsRepository.findById(ticketId);
    if (!ticket) {
      throw AppError.notFound('Ticket not found');
    }

    if (user.role === 'customer') {
      if (ticket.createdById !== user.id) {
        throw AppError.forbidden('Access denied to this ticket');
      }
      // Customers cannot create internal comments
      if (isInternal) {
        throw AppError.forbidden('Customers cannot create internal comments');
      }
    }

    return commentsRepository.create({
      ticketId,
      authorId: user.id,
      body: content,
      isInternal: user.role === 'agent' ? !!isInternal : false,
    });
  },

  async getCommentsByTicketId(user: { id: string; role: string }, ticketId: string) {
    const ticket = await ticketsRepository.findById(ticketId);
    if (!ticket) {
      throw AppError.notFound('Ticket not found');
    }

    if (user.role === 'customer' && ticket.createdById !== user.id) {
      throw AppError.forbidden('Access denied to this ticket');
    }

    const isCustomer = user.role === 'customer';
    return commentsRepository.findByTicketId(ticketId, isCustomer);
  },
};