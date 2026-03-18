const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');

exports.create = async (req, res) => {
  try {
    const exercise = await Exercise.create({
      ...req.validated,
      workoutId: req.params.workoutId,
    });
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listByWorkout = async (req, res) => {
  try {
    const exercises = await Exercise.find({ workoutId: req.params.workoutId }).sort({ order: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.countByProgram = async (req, res) => {
  try {
    const { programId, week } = req.query;
    if (!programId) return res.status(400).json({ error: 'programId is required' });
    const filter = { programId };
    if (week) filter.weekNumber = Number(week);
    const workouts = await Workout.find(filter).select('_id');
    const workoutIds = workouts.map(w => w._id);
    const count = await Exercise.countDocuments({ workoutId: { $in: workoutIds } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }
    const updates = orderedIds.map((id, index) =>
      Exercise.findByIdAndUpdate(id, { order: index })
    );
    await Promise.all(updates);
    const exercises = await Exercise.find({ workoutId: req.params.workoutId }).sort({ order: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
