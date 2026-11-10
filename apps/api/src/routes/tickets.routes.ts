import { Router } from 'express';
import { TicketsController } from '../controllers/tickets.controller';

const router = Router();

// Routes mapping (TicketsController ek object hai, isliye new ke bina call hoga)
router.get('/', TicketsController.list);
router.post('/', TicketsController.create);
router.get('/:id', TicketsController.getById);
router.patch('/:id', TicketsController.update);
router.delete('/:id', TicketsController.remove);

export default router;