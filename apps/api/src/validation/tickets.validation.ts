import { z } from 'zod';

export const ticketStatusSchema = z.enum([
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
]);
export const ticketPrioritySchema = z.enum(['P1', 'P2', 'P3', 'P4']);

export const idParamSchema = z.object({
  id: z.string().min(1, 'Ticket id is required'),
});

export const listQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigneeId: z.string().min(1).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getTicketsQuerySchema = listQuerySchema;

export const createTicketSchema = z.strictObject({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().min(1, 'description is required'),
  category: z.string().trim().min(1, 'category is required').max(50),
  status: ticketStatusSchema.default('open'),
  priority: ticketPrioritySchema.default('P3'),
  slaDueAt: z.coerce.date().optional(),
  assigneeId: z.string().min(1).optional(),
});

export const replaceTicketSchema = createTicketSchema;

export const updateTicketSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).max(50).optional(),
    status: ticketStatusSchema.optional(),
    priority: ticketPrioritySchema.optional(),
    slaDueAt: z.coerce.date().nullable().optional(),
    assigneeId: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const assignTicketSchema = z.strictObject({
  assigneeId: z.string().min(1).nullable(),
});

export type ListTicketsQuery = z.infer<typeof listQuerySchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
