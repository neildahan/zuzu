const express = require('express');
const router = express.Router();
const controller = require('../controllers/exercises');

// These are mounted at /api/exercises in index.js
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
