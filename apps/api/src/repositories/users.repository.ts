import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { AppError } from '../utils/AppError';

const safeUserSelect = { id: true, name: true, email: true, role: true } as const;

export const usersRepository = {
  findById: (id: string) =>
    prisma.user.findUnique({ where: { id }, select: { id: true, role: true } }),

  // Includes passwordHash: use ONLY for login, never send this object to the client
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  async create(data: { name: string; email: string; passwordHash: string }) {
    try {
      return await prisma.user.create({
        data: { ...data, role: 'customer' }, // public registration is always a customer
        select: safeUserSelect, // passwordHash is not returned
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw AppError.conflict('Email is already registered', 'EMAIL_ALREADY_REGISTERED');
      }
      throw err;
    }
  },
};