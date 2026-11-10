import { prisma } from './prisma';

export const usersRepository = {
  findById: (id: string) =>
    prisma.user.findUnique({ where: { id }, select: { id: true, role: true } }),
};