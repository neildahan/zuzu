require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Program = require('./models/Program');
const Workout = require('./models/Workout');
const Exercise = require('./models/Exercise');
const WorkoutLog = require('./models/WorkoutLog');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await User.deleteMany({});
  await Program.deleteMany({});
  await Workout.deleteMany({});
  await Exercise.deleteMany({});
  await WorkoutLog.deleteMany({});
  console.log('Cleared all collections');

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

  // Create program
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

  console.log('\nSeed complete!');
  console.log({
    trainer: { id: trainer._id, name: trainer.name },
    client: { id: client._id, name: client.name },
    program: { id: program._id, name: program.name },
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
  });

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
