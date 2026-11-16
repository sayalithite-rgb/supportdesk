import { Router } from 'express';
import { ticketsController } from '../controllers/tickets.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

const anyUser = requireRole('customer', 'agent', 'admin');
const staffOnly = requireRole('agent', 'admin');

router.use(requireAuth); // every ticket route needs a valid token

router.get('/', anyUser, ticketsController.list);
router.get('/:id', anyUser, ticketsController.getById);
router.post('/', anyUser, ticketsController.create);
router.put('/:id', staffOnly, ticketsController.replace);
router.patch('/:id', staffOnly, ticketsController.update);
router.delete('/:id', staffOnly, ticketsController.remove);

export default router;