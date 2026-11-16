import { Router } from 'express';
import { commentsController } from '../controllers/comments.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);
router.post('/tickets/:ticketId/comments', commentsController.createComment);
router.get('/tickets/:ticketId/comments', commentsController.listComments);

export default router;