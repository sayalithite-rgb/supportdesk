// apps/api/src/index.js
const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Import routes
const ticketRoutes = require('./routes/ticket.routes');

// Mount the ticket routes under /api/tickets
app.use('/api/tickets', ticketRoutes);

// Root test route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'SupportDesk API is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running successfully on port ${PORT}`);
});