// apps/api/src/routes/ticket.routes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

// Route maps to GET /api/tickets
router.get('/', (req, res) => ticketController.getAll(req, res));

// Route maps to POST /api/tickets
router.post('/', (req, res) => ticketController.create(req, res));

module.exports = router;