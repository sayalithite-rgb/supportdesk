import { Prisma, TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from './prisma';
import { AppError } from '../utils/AppError';

export type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
};

// passwordHash is never selected, so it cannot leak in responses
const ticketInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.TicketInclude;

function buildWhere(filters: TicketFilters): Prisma.TicketWhereInput {
  return {
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
  };
}

// Prisma-specific errors are translated here so no other layer needs Prisma
function translatePrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') throw AppError.conflict('A record with these values already exists');
    if (err.code === 'P2025') throw AppError.notFound('Ticket not found');
    if (err.code === 'P2003') {
      throw AppError.badRequest('A referenced record does not exist', 'INVALID_REFERENCE');
    }
  }
  throw err;
}

export const ticketsRepository = {
  findMany: (filters: TicketFilters, skip: number, take: number) =>
    prisma.ticket.findMany({
      where: buildWhere(filters),
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: ticketInclude,
    }),

  count: (filters: TicketFilters) => prisma.ticket.count({ where: buildWhere(filters) }),

  findById: (id: string) => prisma.ticket.findUnique({ where: { id }, include: ticketInclude }),

  async create(data: Prisma.TicketUncheckedCreateInput) {
    try {
      return await prisma.ticket.create({ data, include: ticketInclude });
    } catch (err) {
      return translatePrismaError(err);
    }
  },

  async update(id: string, data: Prisma.TicketUncheckedUpdateInput) {
    try {
      return await prisma.ticket.update({ where: { id }, data, include: ticketInclude });
    } catch (err) {
      return translatePrismaError(err);
    }
  },

  async delete(id: string) {
    try {
      return await prisma.ticket.delete({ where: { id } });
    } catch (err) {
      return translatePrismaError(err);
    }
  },
};