const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const controller = require('../controllers/workoutLogs');

const createLogSchema = z.object({
  clientId: z.string().min(1),
  workoutId: z.string().min(1),
  programId: z.string().min(1),
  weekNumber: z.number(),
  date: z.string().optional(),
  isCompleted: z.boolean().optional(),
  exercises: z.array(z.any()).optional(),
});

router.post('/', validate(createLogSchema), controller.create);
router.get('/', controller.list);

// IMPORTANT: named routes must come before /:id
router.get('/history', controller.history);
router.get('/previous', controller.previous);

router.get('/:id', controller.getById);
router.patch('/:id', controller.update);

module.exports = router;
