export type ReplyContext = {
  ticket: {
    title: string
    description: string
    status: string
    priority: string
    category?: string | null
  }
  comments: { authorRole: string; body: string }[] // purana pehle
}

export type CategorizeInput = { title: string; description: string }

export type AiCallMeta = { ticketId: string; userId?: string }