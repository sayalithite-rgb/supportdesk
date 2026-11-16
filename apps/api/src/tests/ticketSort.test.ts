import { buildTicketOrderBy, allowedSortFields } from '../utils/ticketSort';

describe('ticketSort utility', () => {
  it('should return default sorting when no params are provided', () => {
    const result = buildTicketOrderBy();
    expect(result).toEqual({ createdAt: 'desc' });
  });

  it('should return valid allowed sort field and ascending order', () => {
    const result = buildTicketOrderBy('priority', 'asc');
    expect(result).toEqual({ priority: 'asc' });
  });

  it('should fallback to default createdAt desc if an invalid sort field is provided', () => {
    const result = buildTicketOrderBy('maliciousField', 'asc');
    expect(result).toEqual({ createdAt: 'desc' });
  });

  it('should fallback to desc if invalid sort order is provided', () => {
    const result = buildTicketOrderBy('title', 'invalidOrder');
    expect(result).toEqual({ title: 'desc' });
  });
});