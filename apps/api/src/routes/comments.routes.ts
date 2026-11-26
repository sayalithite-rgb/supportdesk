import { Router } from 'express';
import { commentsController } from '../controllers/comments.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.post('/', commentsController.createComment);
router.get('/', commentsController.listComments);

export default router;