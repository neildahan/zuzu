const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },
    name: { type: String, required: true },
    nameHe: String,
    muscleGroup: String,
    order: { type: Number, default: 0 },
    targets: {
      sets: { type: Number, default: 3 },
      repsMin: { type: Number, default: 8 },
      repsMax: Number,
      weight: Number,
      rir: Number,
      restBetweenSets: { type: Number, default: 60 },
      restAfterExercise: { type: Number, default: 120 },
    },
    videoUrl: String,
    notes: String,
    notesHe: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exercise', exerciseSchema);
