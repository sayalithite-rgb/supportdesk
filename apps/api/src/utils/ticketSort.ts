import { Prisma } from '@prisma/client';

export const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];

export function buildTicketOrderBy(
  sortBy?: string,
  sortOrder?: string
): Prisma.TicketOrderByWithRelationInput {
  const isValidField = sortBy && allowedSortFields.includes(sortBy);
  const field = isValidField ? sortBy : 'createdAt';
  // If field is invalid, fallback to 'desc' order as per test expectation
  const order = isValidField && sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    [field]: order,
  };
}