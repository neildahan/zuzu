const mongoose = require('mongoose');

const exerciseTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHe: { type: String },
  muscleGroup: { type: String, required: true },
  videoUrl: { type: String },
  defaultTargets: {
    sets: { type: Number, default: 3 },
    repsMin: { type: Number, default: 8 },
    repsMax: { type: Number },
    restBetweenSets: { type: Number, default: 90 },
    restAfterExercise: { type: Number, default: 120 },
  },
  notes: { type: String },
  notesHe: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ExerciseTemplate', exerciseTemplateSchema);
