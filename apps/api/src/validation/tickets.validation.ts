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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createTicketSchema = z.strictObject({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().min(1, 'description is required'),
  category: z.string().trim().min(1, 'category is required').max(50),
  status: ticketStatusSchema.default('open'),
  priority: ticketPrioritySchema.default('P3'),
  slaDueAt: z.coerce.date().optional(),
  createdById: z.string().min(1, 'createdById is required'), // temporary until auth (Day 10)
  assigneeId: z.string().min(1).optional(),
});

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

export type ListTicketsQuery = z.infer<typeof listQuerySchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;