const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    name: { type: String, required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    weekNumber: { type: Number, default: 1 },
    type: { type: String, enum: ['strength', 'cardio', 'hybrid'], default: 'strength' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);
