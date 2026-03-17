const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const controller = require('../controllers/users');

const createUserSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['trainer', 'client']),
  email: z.string().optional(),
  trainerId: z.string().optional(),
  locale: z.enum(['en', 'he']).optional(),
});

router.post('/', validate(createUserSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);

module.exports = router;
