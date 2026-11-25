import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiError } from '../../../lib/api-client';
import * as ticketsApi from '../api/tickets.api';
import type { TicketListParams, TicketStatus } from '../types';
import type { CreateCommentInput, CreateTicketInput } from '../schemas';

// Stable query keys. List key mein page/filters hain, to har combination alag cache hota hai.
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params: TicketListParams) => [...ticketKeys.lists(), params] as const,
  // Dashboard ke counts lists() ke andar hain, taaki ticket create/status change ke baad khud refresh ho
  count: (status: string) => [...ticketKeys.lists(), 'count', status] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  comments: (id: string) => [...ticketKeys.all, 'detail', id, 'comments'] as const,
  agents: () => [...ticketKeys.all, 'agents'] as const,
};

// 4xx errors (not found, forbidden) pe retry mat karo, warna error state der se aati hai
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function useTicketList(params: TicketListParams, enabled = true) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => ticketsApi.listTickets(params),
    placeholderData: keepPreviousData,
    enabled,
    retry: shouldRetry,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketsApi.getTicket(id),
    enabled: !!id,
    retry: shouldRetry,
  });
}

export function useComments(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.comments(ticketId),
    queryFn: () => ticketsApi.listComments(ticketId),
    enabled: !!ticketId,
    retry: shouldRetry,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => ticketsApi.createTicket(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketKeys.lists() }),
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => ticketsApi.addComment(ticketId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) }),
  });
}

export function useUpdateTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TicketStatus) => ticketsApi.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      // detail key comments ko bhi cover karta hai, aur lists() list + dashboard counts ko
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

// Dashboard cards ke liye: har status ka total, existing list endpoint ke meta.total se.
// Backend mein alag stats endpoint hota to wo better hota. Lead ko suggest kar sakte ho.
// ⚠️ Status values schema.prisma ke TicketStatus enum se match karo
const COUNT_FILTERS: (TicketStatus | undefined)[] = [undefined, 'open', 'in_progress', 'resolved', 'closed'];

// Result order matches COUNT_FILTERS: [total, open, in_progress, resolved, closed]
export function useTicketCounts() {
  return useQueries({
    queries: COUNT_FILTERS.map((status) => ({
      queryKey: ticketKeys.count(status ?? 'all'),
      queryFn: async () =>
        (await ticketsApi.listTickets({ page: 1, pageSize: 1, status })).meta.total,
      retry: shouldRetry,
    })),
  });
}

export function useAgents(enabled = true) {
  return useQuery({
    queryKey: ticketKeys.agents(),
    queryFn: () => ticketsApi.listAgents(),
    enabled,
    retry: shouldRetry,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: string | null) => ticketsApi.assignTicket(ticketId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}