const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const controller = require('../controllers/programs');

const createProgramSchema = z.object({
  trainerId: z.string().min(1),
  clientId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  weekCount: z.number().optional(),
  isActive: z.boolean().optional(),
});

router.post('/', validate(createProgramSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
