import { AppError } from '../utils/AppError';
import { ticketsRepository } from '../repositories/tickets.repository';
import type { TicketFilters } from '../repositories/tickets.repository';
import { usersRepository } from '../repositories/users.repository';
import type {
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from '../validation/tickets.validation';

// Data-integrity check only (no role rule). Agent-only assignment is NOT added:
// it is not in the approved contract. Ask the lead before adding it.
async function assertUserExists(id: string, field: string): Promise<void> {
  const user = await usersRepository.findById(id);
  if (!user) throw AppError.badRequest(`${field} does not exist`, 'INVALID_REFERENCE');
}

export const ticketsService = {
  async listTickets(query: ListTicketsQuery) {
    const filters: TicketFilters = {
      status: query.status,
      priority: query.priority,
      assigneeId: query.assigneeId,
    };

    const [items, total] = await Promise.all([
      ticketsRepository.findMany(filters, (query.page - 1) * query.limit, query.limit),
      ticketsRepository.count(filters),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getTicketById(id: string) {
    const ticket = await ticketsRepository.findById(id);
    if (!ticket) throw AppError.notFound('Ticket not found');
    return ticket;
  },

  async createTicket(input: CreateTicketInput) {
    await assertUserExists(input.createdById, 'createdById');
    if (input.assigneeId) await assertUserExists(input.assigneeId, 'assigneeId');
    return ticketsRepository.create(input);
  },

  async updateTicket(id: string, input: UpdateTicketInput) {
    await ticketsService.getTicketById(id); // 404 if missing
    if (typeof input.assigneeId === 'string') await assertUserExists(input.assigneeId, 'assigneeId');
    return ticketsRepository.update(id, input);
  },

  async deleteTicket(id: string) {
    await ticketsService.getTicketById(id); // 404 if missing
    await ticketsRepository.delete(id);
    return { id, deleted: true };
  },
};