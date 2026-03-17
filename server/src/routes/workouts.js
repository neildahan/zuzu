const express = require('express');
const router = express.Router({ mergeParams: true });
const { z } = require('zod');
const validate = require('../middleware/validate');
const controller = require('../controllers/workouts');

const createWorkoutSchema = z.object({
  name: z.string().min(1),
  dayOfWeek: z.number().min(0).max(6).optional(),
  weekNumber: z.number().optional(),
  type: z.enum(['strength', 'cardio', 'hybrid']).optional(),
  order: z.number().optional(),
});

// These are mounted at /api/programs/:programId/workouts in index.js
router.post('/', validate(createWorkoutSchema), controller.create);
router.get('/', controller.listByProgram);

module.exports = router;
