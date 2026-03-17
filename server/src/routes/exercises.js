const express = require('express');
const router = express.Router({ mergeParams: true });
const { z } = require('zod');
const validate = require('../middleware/validate');
const controller = require('../controllers/exercises');

const createExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().optional(),
  order: z.number().optional(),
  targets: z
    .object({
      sets: z.number().optional(),
      repsMin: z.number().optional(),
      repsMax: z.number().optional(),
      weight: z.number().optional(),
      rir: z.number().optional(),
      restBetweenSets: z.number().optional(),
      restAfterExercise: z.number().optional(),
    })
    .optional(),
  videoUrl: z.string().optional(),
  notes: z.string().optional(),
});

// These are mounted at /api/workouts/:workoutId/exercises in index.js
router.post('/', validate(createExerciseSchema), controller.create);
router.get('/', controller.listByWorkout);
router.patch('/reorder', controller.reorder);

module.exports = router;
