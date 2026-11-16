import { Request, Response, NextFunction } from 'express';
import { commentsService } from '../services/comments.service';

export const commentsController = {
  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const ticketId = Array.isArray(req.params.ticketId) ? req.params.ticketId[0] : req.params.ticketId;
      const { content } = req.body as { content?: string };

      if (!user) {
        return next(new Error('Authentication required'));
      }
      if (!content) {
        return next(new Error('Comment content is required'));
      }

      const comment = await commentsService.createComment(user, ticketId, content);

      return res.status(201).json({
        data: { comment },
        error: null,
        meta: {},
      });
    } catch (error) {
      return next(error);
    }
  },

  async listComments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const ticketId = Array.isArray(req.params.ticketId) ? req.params.ticketId[0] : req.params.ticketId;

      if (!user) {
        return next(new Error('Authentication required'));
      }

      const comments = await commentsService.getCommentsByTicketId(user, ticketId);

      return res.status(200).json({
        data: { comments },
        error: null,
        meta: {},
      });
    } catch (error) {
      return next(error);
    }
  },
};