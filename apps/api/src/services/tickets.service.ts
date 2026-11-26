import { ticketsRepository } from '../repositories/tickets.repository';
import { usersRepository } from '../repositories/users.repository';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import type {
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from '../validation/tickets.validation';

export const ticketsService = {
  async getTickets(user: { id: string; role: string }, query: ListTicketsQuery) {
    const { page, limit, status, priority, assigneeId, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    // Customers can only view tickets they created.
    if (user.role === 'customer') {
      where.createdById = user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (user.role === 'agent') {
      where.assigneeId = user.id;
    } else if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Search filter implementation across title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { tickets, total } = await ticketsRepository.findMany({
      where,
      skip,
      take: limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      tickets,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  async getTicketById(id: string, user: { id: string; role: string }) {
    const ticket = await ticketsRepository.findById(id);
    if (!ticket) throw AppError.notFound('Ticket not found');
    if (user.role === 'customer' && ticket.createdById !== user.id) {
      throw AppError.forbidden('Access denied to this ticket');
    }
    return ticket;
  },

  async createTicket(input: CreateTicketInput, user: { id: string; role: string }) {
    return ticketsRepository.create({
      ...input,
      createdById: user.id,
    });
  },

  async replaceTicket(
    id: string,
    input: CreateTicketInput,
    user: { id: string; role: string }
  ) {
    if (user.role === 'customer') throw AppError.forbidden('Only staff can update tickets');
    await ticketsService.getTicketById(id, user);
    return ticketsRepository.update(id, input);
  },

  async updateTicket(
    id: string,
    input: UpdateTicketInput,
    user: { id: string; role: string }
  ) {
    if (user.role === 'customer') throw AppError.forbidden('Only staff can update tickets');
    await ticketsService.getTicketById(id, user);
    return ticketsRepository.update(id, input);
  },

  async assignTicket(
    id: string,
    assigneeId: string | null,
    user: { id: string; role: string }
  ) {
    if (user.role !== 'admin') throw AppError.forbidden('Only admins can assign tickets');
    await ticketsService.getTicketById(id, user);

    if (assigneeId !== null) {
      const assignee = await usersRepository.findById(assigneeId);
      if (!assignee) throw AppError.notFound('Assignee not found');
      if (assignee.role !== 'agent') {
        throw AppError.badRequest('Tickets can only be assigned to agents');
      }
    }

    return ticketsRepository.update(id, { assigneeId });
  },

  async deleteTicket(id: string, user: { id: string; role: string }) {
    if (user.role === 'customer') throw AppError.forbidden('Only staff can delete tickets');
    await ticketsService.getTicketById(id, user);
    await ticketsRepository.delete(id);
    return { id, deleted: true };
  },
};