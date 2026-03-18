const User = require('../models/User');
const Program = require('../models/Program');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const WorkoutLog = require('../models/WorkoutLog');
const ExerciseTemplate = require('../models/ExerciseTemplate');

exports.stats = async (req, res) => {
  try {
    const [clients, trainers, programs, activePrograms, logs, completedLogs, templates] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'trainer' }),
      Program.countDocuments(),
      Program.countDocuments({ isActive: true }),
      WorkoutLog.countDocuments(),
      WorkoutLog.countDocuments({ isCompleted: true }),
      ExerciseTemplate.countDocuments(),
    ]);
    res.json({ clients, trainers, programs, activePrograms, logs, completedLogs, templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Cascade delete
    const programs = await Program.find({ $or: [{ trainerId: userId }, { clientId: userId }] });
    const programIds = programs.map(p => p._id);
    const workouts = await Workout.find({ programId: { $in: programIds } });
    const workoutIds = workouts.map(w => w._id);
    await Exercise.deleteMany({ workoutId: { $in: workoutIds } });
    await Workout.deleteMany({ programId: { $in: programIds } });
    await WorkoutLog.deleteMany({ clientId: userId });
    await Program.deleteMany({ $or: [{ trainerId: userId }, { clientId: userId }] });
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User and related data deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find()
      .populate('trainerId', 'name')
      .populate('clientId', 'name')
      .sort({ createdAt: -1 });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWorkoutLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, clientId } = req.query;
    const filter = {};
    if (clientId) filter.clientId = clientId;
    const total = await WorkoutLog.countDocuments(filter);
    const logs = await WorkoutLog.find(filter)
      .populate('clientId', 'name')
      .populate('programId', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Exercise template CRUD
exports.createTemplate = async (req, res) => {
  try {
    const template = await ExerciseTemplate.create(req.body);
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await ExerciseTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await ExerciseTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
