require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Program = require('./models/Program');
const Workout = require('./models/Workout');
const Exercise = require('./models/Exercise');
const WorkoutLog = require('./models/WorkoutLog');
const ExerciseTemplate = require('./models/ExerciseTemplate');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await User.deleteMany({});
  await Program.deleteMany({});
  await Workout.deleteMany({});
  await Exercise.deleteMany({});
  await WorkoutLog.deleteMany({});
  await ExerciseTemplate.deleteMany({});
  console.log('Cleared all collections');

  // ─── Exercise Template Library ───────────────────────────────────
  const templates = await ExerciseTemplate.insertMany([
    // CHEST
    { name: 'Bench Press', nameHe: 'לחיצת חזה', muscleGroup: 'Chest', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', defaultTargets: { sets: 4, repsMin: 8, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: 'Keep shoulder blades retracted', notesHe: 'שמור על השכמות צמודות' },
    { name: 'Incline Dumbbell Press', nameHe: 'לחיצת חזה משופע עם משקולות', muscleGroup: 'Chest', videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: '30-45 degree incline', notesHe: 'שיפוע 30-45 מעלות' },
    { name: 'Cable Flyes', nameHe: 'פרפר בכבלים', muscleGroup: 'Chest', videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o', defaultTargets: { sets: 3, repsMin: 12, repsMax: 15, restBetweenSets: 60, restAfterExercise: 120 }, notes: 'Slight bend in elbows', notesHe: 'כיפוף קל במרפקים' },
    { name: 'Dips (Chest)', nameHe: 'מקבילים לחזה', muscleGroup: 'Chest', videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As', defaultTargets: { sets: 3, repsMin: 8, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: 'Lean forward for chest emphasis', notesHe: 'הישען קדימה לדגש על החזה' },
    { name: 'Push-Ups', nameHe: 'שכיבות סמיכה', muscleGroup: 'Chest', videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4', defaultTargets: { sets: 3, repsMin: 12, repsMax: 20, restBetweenSets: 60, restAfterExercise: 90 } },

    // BACK
    { name: 'Barbell Row', nameHe: 'חתירה עם מוט', muscleGroup: 'Back', videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ', defaultTargets: { sets: 4, repsMin: 8, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: 'Keep back flat, pull to lower chest', notesHe: 'שמור גב ישר, משוך לחזה תחתון' },
    { name: 'Lat Pulldown', nameHe: 'משיכה עליונה', muscleGroup: 'Back', videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: 'Pull to upper chest, squeeze lats', notesHe: 'משוך לחזה עליון, לחץ את הגב' },
    { name: 'Seated Cable Row', nameHe: 'חתירה בכבל יושב', muscleGroup: 'Back', videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 } },
    { name: 'Pull-Ups', nameHe: 'מתח', muscleGroup: 'Back', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', defaultTargets: { sets: 3, repsMin: 6, repsMax: 12, restBetweenSets: 120, restAfterExercise: 120 } },
    { name: 'Deadlift', nameHe: 'מתים', muscleGroup: 'Back', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', defaultTargets: { sets: 4, repsMin: 5, repsMax: 8, restBetweenSets: 180, restAfterExercise: 180 }, notes: 'Hinge at hips, keep bar close', notesHe: 'כיפוף במותניים, שמור מוט צמוד' },
    { name: 'Face Pulls', nameHe: 'משיכת פנים', muscleGroup: 'Back', videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk', defaultTargets: { sets: 3, repsMin: 15, repsMax: 20, restBetweenSets: 60, restAfterExercise: 90 } },

    // SHOULDERS
    { name: 'Overhead Press', nameHe: 'לחיצת כתפיים', muscleGroup: 'Shoulders', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', defaultTargets: { sets: 4, repsMin: 8, repsMax: 10, restBetweenSets: 90, restAfterExercise: 120 } },
    { name: 'Lateral Raises', nameHe: 'הרמות צד', muscleGroup: 'Shoulders', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', defaultTargets: { sets: 3, repsMin: 12, repsMax: 15, restBetweenSets: 60, restAfterExercise: 90 }, notes: 'Control the negative', notesHe: 'שלוט בירידה' },
    { name: 'Rear Delt Flyes', nameHe: 'פרפר אחורי', muscleGroup: 'Shoulders', videoUrl: 'https://www.youtube.com/watch?v=EA7u4Q_8HQ0', defaultTargets: { sets: 3, repsMin: 12, repsMax: 15, restBetweenSets: 60, restAfterExercise: 90 } },
    { name: 'Arnold Press', nameHe: 'לחיצת ארנולד', muscleGroup: 'Shoulders', videoUrl: 'https://www.youtube.com/watch?v=6Z15_WdXmVw', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 } },

    // BICEPS
    { name: 'Barbell Curl', nameHe: 'כפיפת מרפק עם מוט', muscleGroup: 'Biceps', videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgfo', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 60, restAfterExercise: 90 } },
    { name: 'Hammer Curls', nameHe: 'כפיפת פטיש', muscleGroup: 'Biceps', videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 60, restAfterExercise: 90 } },
    { name: 'Incline Dumbbell Curl', nameHe: 'כפיפה על ספסל משופע', muscleGroup: 'Biceps', videoUrl: 'https://www.youtube.com/watch?v=soxrZlIl35U', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 60, restAfterExercise: 90 } },

    // TRICEPS
    { name: 'Tricep Pushdown', nameHe: 'לחיצת טרייספס', muscleGroup: 'Triceps', videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU', defaultTargets: { sets: 3, repsMin: 10, repsMax: 15, restBetweenSets: 60, restAfterExercise: 90 } },
    { name: 'Skull Crushers', nameHe: 'מעיכת גולגולת', muscleGroup: 'Triceps', videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 60, restAfterExercise: 90 } },
    { name: 'Overhead Tricep Extension', nameHe: 'פשיטת טרייספס מעל הראש', muscleGroup: 'Triceps', videoUrl: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 60, restAfterExercise: 90 } },

    // QUADS
    { name: 'Barbell Squat', nameHe: 'סקוואט עם מוט', muscleGroup: 'Quads', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', defaultTargets: { sets: 4, repsMin: 6, repsMax: 10, restBetweenSets: 120, restAfterExercise: 180 }, notes: 'Depth below parallel', notesHe: 'ירידה מתחת למקביל' },
    { name: 'Leg Press', nameHe: 'מכבש רגליים', muscleGroup: 'Quads', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', defaultTargets: { sets: 4, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 } },
    { name: 'Leg Extension', nameHe: 'פשיטת רגליים', muscleGroup: 'Quads', videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0', defaultTargets: { sets: 3, repsMin: 12, repsMax: 15, restBetweenSets: 60, restAfterExercise: 90 } },
    { name: 'Bulgarian Split Squat', nameHe: 'סקוואט בולגרי', muscleGroup: 'Quads', videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE', defaultTargets: { sets: 3, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 } },

    // HAMSTRINGS
    { name: 'Romanian Deadlift', nameHe: 'מתים רומני', muscleGroup: 'Hamstrings', videoUrl: 'https://www.youtube.com/watch?v=7j-2w4-P14I', defaultTargets: { sets: 4, repsMin: 8, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: 'Feel the hamstring stretch', notesHe: 'הרגש את המתיחה' },
    { name: 'Leg Curl', nameHe: 'כפיפת רגליים', muscleGroup: 'Hamstrings', videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', defaultTargets: { sets: 3, repsMin: 10, repsMax: 15, restBetweenSets: 60, restAfterExercise: 90 } },

    // GLUTES
    { name: 'Hip Thrust', nameHe: 'דחיפת ירך', muscleGroup: 'Glutes', videoUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg', defaultTargets: { sets: 4, repsMin: 10, repsMax: 12, restBetweenSets: 90, restAfterExercise: 120 }, notes: 'Squeeze glutes at top', notesHe: 'לחץ ישבן למעלה' },
    { name: 'Cable Kickback', nameHe: 'בעיטה אחורית בכבל', muscleGroup: 'Glutes', videoUrl: 'https://www.youtube.com/watch?v=mJBbEG1E40Y', defaultTargets: { sets: 3, repsMin: 12, repsMax: 15, restBetweenSets: 60, restAfterExercise: 90 } },

    // CALVES
    { name: 'Standing Calf Raise', nameHe: 'הרמת עקבים עומד', muscleGroup: 'Calves', videoUrl: 'https://www.youtube.com/watch?v=gwLzBJYoWlI', defaultTargets: { sets: 4, repsMin: 12, repsMax: 20, restBetweenSets: 60, restAfterExercise: 60 } },
    { name: 'Seated Calf Raise', nameHe: 'הרמת עקבים יושב', muscleGroup: 'Calves', videoUrl: 'https://www.youtube.com/watch?v=JbyjNymZOt0', defaultTargets: { sets: 3, repsMin: 15, repsMax: 20, restBetweenSets: 60, restAfterExercise: 60 } },

    // CORE
    { name: 'Plank', nameHe: 'פלאנק', muscleGroup: 'Core', videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c', defaultTargets: { sets: 3, repsMin: 30, repsMax: 60, restBetweenSets: 60, restAfterExercise: 60 }, notes: 'Hold for seconds (reps = seconds)', notesHe: 'החזק בשניות (חזרות = שניות)' },
    { name: 'Cable Crunch', nameHe: 'כפיפת בטן בכבל', muscleGroup: 'Core', videoUrl: 'https://www.youtube.com/watch?v=AV5PmrIVoLk', defaultTargets: { sets: 3, repsMin: 12, repsMax: 15, restBetweenSets: 60, restAfterExercise: 60 } },
    { name: 'Hanging Leg Raise', nameHe: 'הרמת רגליים בתלייה', muscleGroup: 'Core', videoUrl: 'https://www.youtube.com/watch?v=hdng3Nm1x_E', defaultTargets: { sets: 3, repsMin: 10, repsMax: 15, restBetweenSets: 60, restAfterExercise: 60 } },
  ]);
  console.log(`Created ${templates.length} exercise templates`);

  // ─── Users ───────────────────────────────────────────────────────

  // Create trainer
  const trainer = await User.create({
    name: 'Coach Dan',
    role: 'trainer',
    email: 'dan@zuzu.com',
    password: 'password123',
    locale: 'en',
  });
  console.log('Created trainer:', trainer.name);

  // Create client
  const client = await User.create({
    name: 'Yuval',
    role: 'client',
    email: 'yuval@zuzu.com',
    password: 'password123',
    trainerId: trainer._id,
    locale: 'he',
  });
  console.log('Created client:', client.name);

  // Create Neil (trainer)
  const neil = await User.create({
    name: 'Neil',
    role: 'trainer',
    email: 'neil@zuzu.com',
    password: 'password123',
    locale: 'he',
  });
  console.log('Created trainer:', neil.name);

  // Create client Hila under Neil
  const hila = await User.create({
    name: 'Hila',
    role: 'client',
    email: 'hila@zuzu.com',
    password: 'password123',
    trainerId: neil._id,
    locale: 'he',
  });
  console.log('Created client:', hila.name);

  // ─── Coach Dan's Program (original) ─────────────────────────────

  const program = await Program.create({
    trainerId: trainer._id,
    clientId: client._id,
    name: 'Hypertrophy Block A',
    weekCount: 4,
    isActive: true,
  });
  console.log('Created program:', program.name);

  // Create workouts
  const pushDay = await Workout.create({
    programId: program._id,
    name: 'Push Day',
    dayOfWeek: 0,
    weekNumber: 1,
    type: 'strength',
    order: 0,
  });

  const pullDay = await Workout.create({
    programId: program._id,
    name: 'Pull Day',
    dayOfWeek: 2,
    weekNumber: 1,
    type: 'strength',
    order: 1,
  });

  const legsDay = await Workout.create({
    programId: program._id,
    name: 'Legs Day',
    dayOfWeek: 4,
    weekNumber: 1,
    type: 'strength',
    order: 2,
  });
  console.log('Created workouts: Push Day, Pull Day, Legs Day');

  // Create exercises for Push Day
  const benchPress = await Exercise.create({
    workoutId: pushDay._id,
    name: 'Bench Press',
    muscleGroup: 'Chest',
    order: 0,
    targets: {
      sets: 4,
      repsMin: 8,
      repsMax: 12,
      weight: 60,
      rir: 2,
      restBetweenSets: 90,
      restAfterExercise: 120,
    },
  });

  const overheadPress = await Exercise.create({
    workoutId: pushDay._id,
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    order: 1,
    targets: {
      sets: 3,
      repsMin: 8,
      repsMax: 10,
      weight: 40,
      rir: 2,
      restBetweenSets: 90,
      restAfterExercise: 120,
    },
  });

  const tricepPushdown = await Exercise.create({
    workoutId: pushDay._id,
    name: 'Tricep Pushdown',
    muscleGroup: 'Triceps',
    order: 2,
    targets: {
      sets: 3,
      repsMin: 10,
      repsMax: 15,
      rir: 1,
      restBetweenSets: 60,
      restAfterExercise: 0,
    },
  });
  console.log('Created exercises: Bench Press, Overhead Press, Tricep Pushdown');

  // ─── Hila's 4-Week Program ──────────────────────────────────────

  const hilaProgram = await Program.create({
    trainerId: neil._id,
    clientId: hila._id,
    name: 'Full Body Transformation',
    description: 'תוכנית 4 שבועות לכל הגוף',
    weekCount: 4,
    isActive: true,
  });
  console.log('Created program:', hilaProgram.name);

  // Helper to create exercises from template names
  async function createExercisesFromTemplates(workoutId, templateNames) {
    for (let i = 0; i < templateNames.length; i++) {
      const tmpl = templates.find(t => t.name === templateNames[i]);
      if (!tmpl) { console.log('Template not found:', templateNames[i]); continue; }
      await Exercise.create({
        workoutId,
        name: tmpl.name,
        nameHe: tmpl.nameHe,
        muscleGroup: tmpl.muscleGroup,
        order: i,
        videoUrl: tmpl.videoUrl,
        notes: tmpl.notes,
        notesHe: tmpl.notesHe,
        targets: {
          sets: tmpl.defaultTargets.sets,
          repsMin: tmpl.defaultTargets.repsMin,
          repsMax: tmpl.defaultTargets.repsMax,
          restBetweenSets: tmpl.defaultTargets.restBetweenSets,
          restAfterExercise: tmpl.defaultTargets.restAfterExercise,
        },
      });
    }
  }

  const dayConfigs = [
    { name: 'Push Day', nameHe: 'יום דחיפה', dayOfWeek: 0, type: 'strength', exercises: ['Bench Press', 'Incline Dumbbell Press', 'Lateral Raises', 'Tricep Pushdown', 'Cable Flyes'] },
    { name: 'Pull Day', nameHe: 'יום משיכה', dayOfWeek: 2, type: 'strength', exercises: ['Barbell Row', 'Lat Pulldown', 'Face Pulls', 'Barbell Curl', 'Hammer Curls'] },
    { name: 'Legs Day', nameHe: 'יום רגליים', dayOfWeek: 4, type: 'strength', exercises: ['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Standing Calf Raise'] },
    { name: 'Upper & Core', nameHe: 'פלג גוף עליון וליבה', dayOfWeek: 6, type: 'hybrid', exercises: ['Overhead Press', 'Seated Cable Row', 'Arnold Press', 'Skull Crushers', 'Hanging Leg Raise'] },
  ];

  // Create workouts for all 4 weeks
  for (let week = 1; week <= 4; week++) {
    for (let d = 0; d < dayConfigs.length; d++) {
      const cfg = dayConfigs[d];
      const workout = await Workout.create({
        programId: hilaProgram._id,
        name: cfg.name,
        dayOfWeek: cfg.dayOfWeek,
        weekNumber: week,
        type: cfg.type,
        order: d,
      });
      await createExercisesFromTemplates(workout._id, cfg.exercises);
    }
  }
  console.log('Created 4 weeks of workouts with exercises for Hila');

  // ─── Summary ─────────────────────────────────────────────────────

  console.log('\nSeed complete!');
  console.log({
    trainer: { id: trainer._id, name: trainer.name },
    client: { id: client._id, name: client.name },
    neil: { id: neil._id, name: neil.name },
    hila: { id: hila._id, name: hila.name },
    program: { id: program._id, name: program.name },
    hilaProgram: { id: hilaProgram._id, name: hilaProgram.name },
    workouts: [
      { id: pushDay._id, name: pushDay.name },
      { id: pullDay._id, name: pullDay.name },
      { id: legsDay._id, name: legsDay.name },
    ],
    exercises: [
      { id: benchPress._id, name: benchPress.name },
      { id: overheadPress._id, name: overheadPress.name },
      { id: tricepPushdown._id, name: tricepPushdown.name },
    ],
    templates: templates.length,
  });

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
