const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    weekNumber: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false },
    exercises: [
      {
        exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
        sets: [
          {
            setNumber: Number,
            reps: Number,
            weight: Number,
            rir: Number,
            isCompleted: { type: Boolean, default: false },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
