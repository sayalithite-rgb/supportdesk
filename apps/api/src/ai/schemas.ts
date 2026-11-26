import { z } from 'zod'

// ⚠️ tickets.validation.ts mein ye list pehle se export ho to wahin se import karo (duplicate mat banao)
export const AI_CATEGORIES = ['account', 'technical', 'general'] as const
export const AI_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const

export const categorizeOutputSchema = z.object({
  category: z.enum(AI_CATEGORIES),
  priority: z.enum(AI_PRIORITIES),
  reason: z.string().trim().max(300).optional(),
})

export type CategorizeSuggestion = z.infer<typeof categorizeOutputSchema>