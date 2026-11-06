let tickets = [
  { id: 1, title: 'Login failing on Firefox', status: 'OPEN', priority: 'HIGH', createdBy: 'user1' },
  { id: 2, title: 'Password reset link broken', status: 'CLOSED', priority: 'MEDIUM', createdBy: 'user2' }
];

class TicketRepository {
  getAll() {
    return tickets;
  }

  save(ticket) {
    tickets.push(ticket);
    return ticket;
  }

  findById(id) {
    return tickets.find(t => t.id === id);
  }

  delete(index) {
    return tickets.splice(index, 1)[0];
  }
}

module.exports = new TicketRepository();