import { ticketsService } from '../services/tickets.service';
import { ticketsRepository } from '../repositories/tickets.repository';

// Mock the repository layer
jest.mock('../repositories/tickets.repository');

describe('ticketsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should restrict agents to tickets assigned to themselves', async () => {
    (ticketsRepository.findMany as jest.Mock).mockResolvedValue({
      tickets: [{ id: 'ticket-1', title: 'Test Ticket' }],
      total: 1,
    });

    const result = await ticketsService.getTickets(
      { id: 'agent-1', role: 'agent' },
      { page: 1, limit: 10, assigneeId: 'agent-2' }
    );

    expect(ticketsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assigneeId: 'agent-1' },
        skip: 0,
        take: 10,
      })
    );
    expect(result.meta.total).toBe(1);
    expect(result.tickets.length).toBe(1);
  });

  it('should automatically scope tickets by createdById when user role is customer', async () => {
    (ticketsRepository.findMany as jest.Mock).mockResolvedValue({
      tickets: [],
      total: 0,
    });

    await ticketsService.getTickets(
      { id: 'customer-xyz', role: 'customer' },
      { page: 1, limit: 10 }
    );

    expect(ticketsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdById: 'customer-xyz' },
      })
    );
  });

  it('should include search filter in where clause when search param is provided', async () => {
    (ticketsRepository.findMany as jest.Mock).mockResolvedValue({
      tickets: [],
      total: 0,
    });

    await ticketsService.getTickets(
      { id: 'agent-1', role: 'agent' },
      { page: 1, limit: 10, search: 'login error' }
    );

    expect(ticketsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assigneeId: 'agent-1',
          OR: [
            { title: { contains: 'login error', mode: 'insensitive' } },
            { description: { contains: 'login error', mode: 'insensitive' } },
          ],
        }),
      })
    );
  });
});