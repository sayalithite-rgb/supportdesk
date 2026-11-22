import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getAuthUser } from '../utils/authUser';
import { ticketsService } from '../services/tickets.service';
import {
  createTicketSchema,
  idParamSchema,
  getTicketsQuerySchema,
  assignTicketSchema,
  replaceTicketSchema,
  updateTicketSchema,
} from '../validation/tickets.validation';

export const ticketsController = {
  list: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const query = getTicketsQuerySchema.parse(req.query);
    const { tickets, meta } = await ticketsService.getTickets(actor, query);
    sendSuccess(res, tickets, meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const { id } = idParamSchema.parse(req.params);
    sendSuccess(res, await ticketsService.getTicketById(id, actor));
  }),

  create: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const input = createTicketSchema.parse(req.body);
    sendSuccess(res, await ticketsService.createTicket(input, actor), {}, 201);
  }),

  replace: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const { id } = idParamSchema.parse(req.params);
    const input = replaceTicketSchema.parse(req.body);
    sendSuccess(res, await ticketsService.replaceTicket(id, input, actor));
  }),

  assign: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const { id } = idParamSchema.parse(req.params);
    const input = assignTicketSchema.parse(req.body);
    sendSuccess(res, await ticketsService.assignTicket(id, input.assigneeId, actor));
  }),

  update: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const { id } = idParamSchema.parse(req.params);
    const input = updateTicketSchema.parse(req.body);
    sendSuccess(res, await ticketsService.updateTicket(id, input, actor));
  }),

  remove: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const { id } = idParamSchema.parse(req.params);
    sendSuccess(res, await ticketsService.deleteTicket(id, actor));
  }),
};