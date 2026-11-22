export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = ['account', 'technical', 'general'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

// Record<TicketStatus, ...> ka fayda: enum mein koi status add ho aur label na ho to TypeScript error dega
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_customer: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  account: 'Account',
  technical: 'Technical',
  general: 'General',
};

export type TicketUserSummary = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
};

export type TicketAssignee = TicketUserSummary & { id: string };

// ⚠️ Step 0.3 ke asli response se fields match karo
export type Ticket = {
  id: string;
  title?: string;
  subject?: string;
  description?: string;
  category?: TicketCategory | string | null;
  status: TicketStatus;
  priority?: TicketPriority | string;
  customerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customer?: TicketUserSummary | null;
  createdBy?: TicketUserSummary | null;
  assigneeId?: string | null;
  assignee?: TicketUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
};

// ⚠️ Backend ke comment response se match karo
export type TicketComment = {
  id: string;
  body: string;
  createdAt: string;
  author?: { name?: string; email?: string };
  isInternal?: boolean;
};

// ⚠️ Backend ke meta se match karo
export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type TicketListParams = {
  page: number;
  pageSize: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigneeId?: string;
};