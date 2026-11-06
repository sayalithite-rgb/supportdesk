// apps/api/src/controllers/ticket.controller.js
const ticketService = require('../services/ticket.service');

class TicketController {
  getAll(req, res) {
    try {
      const items = ticketService.getAllTickets();
      return res.status(200).json({ success: true, count: items.length, items });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  create(req, res) {
    try {
      const newTicket = ticketService.createTicket(req.body);
      return res.status(201).json({ success: true, ticket: newTicket });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new TicketController();