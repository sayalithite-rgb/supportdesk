// apps/api/src/services/ticket.service.js
const ticketRepository = require('../repositories/ticket.repository');

class TicketService {
  getAllTickets() {
    return ticketRepository.getAll();
  }

  createTicket(ticketData) {
    if (!ticketData.title || ticketData.title.trim() === '') {
      throw new Error('Title is required');
    }
    if (ticketData.title.length < 5) {
      throw new Error('Title must be at least 5 characters long');
    }

    const tickets = ticketRepository.getAll();
    const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;

    const newTicket = {
      id: newId,
      title: ticketData.title,
      status: 'OPEN',
      priority: ticketData.priority || 'MEDIUM',
      createdBy: ticketData.createdBy || 'anonymous'
    };

    return ticketRepository.save(newTicket);
  }
}

module.exports = new TicketService();