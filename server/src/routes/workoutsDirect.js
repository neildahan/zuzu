const express = require('express');
const router = express.Router();
const controller = require('../controllers/workouts');

// These are mounted at /api/workouts in index.js
router.post('/:id/duplicate', controller.duplicate);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
