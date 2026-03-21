const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    weekNumber: { type: Number, default: 1 },
    date: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false },
    exercises: [
      {
        exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
        templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseTemplate' },
        name: String,
        nameHe: String,
        muscleGroup: String,
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
