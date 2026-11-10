import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ticketsService } from '../services/tickets.service';
import {
  createTicketSchema,
  idParamSchema,
  listQuerySchema,
  updateTicketSchema,
} from '../validation/tickets.validation';

export const TicketsController = {
  list: asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const { items, meta } = await ticketsService.listTickets(query);
    sendSuccess(res, items, meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const ticket = await ticketsService.getTicketById(id);
    sendSuccess(res, ticket);
  }),

  create: asyncHandler(async (req, res) => {
    const input = createTicketSchema.parse(req.body);
    const ticket = await ticketsService.createTicket(input);
    sendSuccess(res, ticket, {}, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = updateTicketSchema.parse(req.body);
    const ticket = await ticketsService.updateTicket(id, input);
    sendSuccess(res, ticket);
  }),

  remove: asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const result = await ticketsService.deleteTicket(id);
    sendSuccess(res, result);
  }),
};