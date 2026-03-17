const WorkoutLog = require('../models/WorkoutLog');

exports.create = async (req, res) => {
  try {
    const log = await WorkoutLog.create(req.validated);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId) filter.clientId = req.query.clientId;
    if (req.query.workoutId) filter.workoutId = req.query.workoutId;
    if (req.query.programId) filter.programId = req.query.programId;
    if (req.query.weekNumber) filter.weekNumber = Number(req.query.weekNumber);
    const logs = await WorkoutLog.find(filter).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.previous = async (req, res) => {
  try {
    const { clientId, exerciseId } = req.query;
    if (!clientId || !exerciseId) {
      return res.status(400).json({ error: 'clientId and exerciseId are required' });
    }
    const log = await WorkoutLog.findOne({
      clientId,
      'exercises.exerciseId': exerciseId,
    }).sort({ date: -1 });

    if (!log) return res.json(null);

    const exerciseData = log.exercises.find(
      (e) => e.exerciseId.toString() === exerciseId
    );
    res.json(exerciseData || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const log = await WorkoutLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Workout log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const log = await WorkoutLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!log) return res.status(404).json({ error: 'Workout log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
