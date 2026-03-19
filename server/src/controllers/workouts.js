const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

exports.create = async (req, res) => {
  try {
    const workout = await Workout.create({
      ...req.validated,
      programId: req.params.programId,
    });
    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listByProgram = async (req, res) => {
  try {
    const filter = { programId: req.params.programId };
    if (req.query.week) filter.weekNumber = Number(req.query.week);
    const workouts = await Workout.find(filter).sort({ order: 1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.duplicate = async (req, res) => {
  try {
    const source = await Workout.findById(req.params.id);
    if (!source) return res.status(404).json({ error: 'Workout not found' });
    const allWorkouts = await Workout.find({ programId: source.programId, weekNumber: source.weekNumber });
    const newOrder = allWorkouts.length;
    const newWorkout = await Workout.create({
      programId: source.programId,
      name: `${source.name} (copy)`,
      dayOfWeek: source.dayOfWeek,
      weekNumber: source.weekNumber,
      type: source.type,
      order: newOrder,
    });
    const exercises = await Exercise.find({ workoutId: source._id });
    if (exercises.length > 0) {
      await Exercise.insertMany(exercises.map((ex, i) => ({
        workoutId: newWorkout._id,
        name: ex.name,
        nameHe: ex.nameHe,
        muscleGroup: ex.muscleGroup,
        order: ex.order,
        targets: ex.targets,
        videoUrl: ex.videoUrl,
        notes: ex.notes,
        notesHe: ex.notesHe,
      })));
    }
    res.status(201).json(newWorkout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
