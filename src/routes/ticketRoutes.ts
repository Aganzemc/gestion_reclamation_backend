// routes/ticketRoutes.ts
import express from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { assignmentController } from '../controllers/assignmentController';

const router = express.Router();
// authenticate 
router.get('/', ticketController.getTickets);
router.post('/', ticketController.createTicket);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);
router.patch('/:id/status', ticketController.updateTicketStatus);
router.get('/user/:userId', ticketController.getUserTickets);

// Routes pour les assignations d'un ticket spécifique
router.get('/:ticketId/assignments', assignmentController.getTicketAssignments);
router.post('/:ticketId/assignments', assignmentController.createAssignment);
router.delete('/:ticketId/assignments/:assignmentId', assignmentController.deleteAssignment);

export default router;