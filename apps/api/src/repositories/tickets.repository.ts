import { PrismaClient, Ticket, Prisma } from '@prisma/client';
import { buildTicketOrderBy } from '../utils/ticketSort';

const prisma = new PrismaClient();

export const ticketsRepository = {
  async findMany(params: {
    where: Prisma.TicketWhereInput;
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { where, skip, take, sortBy, sortOrder } = params;
    const orderBy = buildTicketOrderBy(sortBy, sortOrder);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, total };
  },

  async findById(id: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async create(data: Prisma.TicketUncheckedCreateInput) {
    return prisma.ticket.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async update(id: string, data: Prisma.TicketUncheckedUpdateInput) {
    return prisma.ticket.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.ticket.delete({ where: { id } });
  },
};