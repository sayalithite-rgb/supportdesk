import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getAuthUser } from '../utils/authUser';
import { ticketsService } from '../services/tickets.service';
import {
  createTicketSchema,
  idParamSchema,
  listQuerySchema,
  replaceTicketSchema,
  updateTicketSchema,
} from '../validation/tickets.validation';

export const ticketsController = {
  list: asyncHandler(async (req, res) => {
    const actor = getAuthUser(req);
    const query = listQuerySchema.parse(req.query);
    const { items, meta } = await ticketsService.listTickets(query, actor);
    sendSuccess(res, items, meta);
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