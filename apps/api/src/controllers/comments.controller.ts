import type { Request, Response } from 'express';
import { commentsService } from '../services/comments.service';
import { createCommentSchema } from '../validation/comments.validation';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export const commentsController = {
  createComment: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const ticketId = Array.isArray(req.params.ticketId)
      ? req.params.ticketId[0]
      : req.params.ticketId;

    if (!user) throw AppError.unauthorized('Authentication required');
    if (!ticketId) throw AppError.badRequest('Ticket id is required');

    const input = createCommentSchema.parse(req.body);
    const comment = await commentsService.createComment(
      user,
      ticketId,
      input.content,
      input.isInternal
    );

    sendSuccess(res, comment, {}, 201);
  }),

  listComments: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const ticketId = Array.isArray(req.params.ticketId)
      ? req.params.ticketId[0]
      : req.params.ticketId;

    if (!user) throw AppError.unauthorized('Authentication required');
    if (!ticketId) throw AppError.badRequest('Ticket id is required');

    const comments = await commentsService.getCommentsByTicketId(user, ticketId);

    sendSuccess(res, comments);
  }),
};