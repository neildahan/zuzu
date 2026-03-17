const express = require('express');
const router = express.Router();
const ExerciseTemplate = require('../models/ExerciseTemplate');

// GET all templates, optionally filter by muscleGroup
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.muscleGroup) filter.muscleGroup = req.query.muscleGroup;
    const templates = await ExerciseTemplate.find(filter).sort({ muscleGroup: 1, name: 1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single template
router.get('/:id', async (req, res) => {
  try {
    const template = await ExerciseTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
