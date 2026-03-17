const express = require('express');
const router = express.Router({ mergeParams: true });
const { z } = require('zod');
const validate = require('../middleware/validate');
const controller = require('../controllers/exercises');

const createExerciseSchema = z.object({
  name: z.string().min(1),
  nameHe: z.string().optional(),
  muscleGroup: z.string().optional(),
  order: z.number().optional(),
  targets: z
    .object({
      sets: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
      repsMin: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
      repsMax: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
      weight: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
      rir: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
      restBetweenSets: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
      restAfterExercise: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v == null ? undefined : Number(v)),
    })
    .optional(),
  videoUrl: z.string().optional(),
  notes: z.string().optional(),
  notesHe: z.string().optional(),
});

// These are mounted at /api/workouts/:workoutId/exercises in index.js
router.post('/', validate(createExerciseSchema), controller.create);
router.get('/', controller.listByWorkout);
router.patch('/reorder', controller.reorder);

module.exports = router;
