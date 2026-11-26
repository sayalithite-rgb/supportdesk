import { PrismaClient, Comment, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const commentsRepository = {
  async create(data: Prisma.CommentUncheckedCreateInput): Promise<Comment> {
    return prisma.comment.create({
      data,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async findByTicketId(ticketId: string, isCustomer: boolean): Promise<Comment[]> {
    const where: Prisma.CommentWhereInput = { ticketId };
    
    // Customers should not see internal comments
    if (isCustomer) {
      where.isInternal = false;
    }

    return prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  },
};