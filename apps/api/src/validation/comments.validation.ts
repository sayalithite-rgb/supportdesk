import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000, 'Comment is too long'),
  isInternal: z.boolean().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;