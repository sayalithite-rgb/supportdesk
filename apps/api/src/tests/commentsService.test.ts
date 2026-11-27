import { commentsService } from '../services/comments.service';
import { commentsRepository } from '../repositories/comments.repository';
import { ticketsRepository } from '../repositories/tickets.repository';

jest.mock('../repositories/comments.repository');
jest.mock('../repositories/tickets.repository');

describe('commentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw 404 error if ticket does not exist when creating comment', async () => {
    (ticketsRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      commentsService.createComment({ id: 'user-1', role: 'agent' }, 'non-existent-id', 'Hello')
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('should forbid customer from creating internal comments', async () => {
    (ticketsRepository.findById as jest.Mock).mockResolvedValue({
      id: 'ticket-1',
      createdById: 'customer-1',
    });

    await expect(
      commentsService.createComment(
        { id: 'customer-1', role: 'customer' },
        'ticket-1',
        'Secret note',
        true
      )
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('should successfully create a comment for agent', async () => {
    (ticketsRepository.findById as jest.Mock).mockResolvedValue({
      id: 'ticket-1',
      createdById: 'customer-1',
    });
    (commentsRepository.create as jest.Mock).mockResolvedValue({
      id: 'comm-1',
      body: 'Working on it',
      isInternal: false,
    });

    const result = await commentsService.createComment(
      { id: 'agent-1', role: 'agent' },
      'ticket-1',
      'Working on it'
    );

    expect(result).toHaveProperty('id', 'comm-1');
    expect(commentsRepository.create).toHaveBeenCalled();
  });

  it('should forbid customer from viewing comments on other tickets', async () => {
    (ticketsRepository.findById as jest.Mock).mockResolvedValue({
      id: 'ticket-1',
      createdById: 'other-customer',
    });

    await expect(
      commentsService.getCommentsByTicketId({ id: 'customer-1', role: 'customer' }, 'ticket-1')
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });
});