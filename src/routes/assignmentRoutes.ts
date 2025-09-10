// routes/assignmentRoutes.ts
import express from 'express';
import { assignmentController } from '../controllers/assignmentController';
// import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', assignmentController.getAssignments);
router.post('/', assignmentController.createAssignment);
router.get('/:id', assignmentController.getAssignmentById);
router.delete('/:id', assignmentController.deleteAssignment);

// Routes spécifiques
router.get('/ticket/:ticketId', assignmentController.getTicketAssignments);
router.get('/user/:userId', assignmentController.getUserAssignments);
router.delete('/ticket/:ticketId/user/:userId', assignmentController.removeUserFromTicket);
router.get('/stats/assignments', assignmentController.getAssignmentStats);

export default router;