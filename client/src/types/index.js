// Type reference for the Zuzu data model
// These are documented here for developer reference

/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {'trainer'|'client'} role
 * @property {string} [email]
 * @property {string} [trainerId]
 * @property {'en'|'he'} locale
 */

/**
 * @typedef {Object} Program
 * @property {string} _id
 * @property {string} trainerId
 * @property {string} clientId
 * @property {string} name
 * @property {string} [description]
 * @property {number} weekCount
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Workout
 * @property {string} _id
 * @property {string} programId
 * @property {string} name
 * @property {number} dayOfWeek
 * @property {number} weekNumber
 * @property {'strength'|'cardio'|'hybrid'} type
 * @property {number} order
 */

/**
 * @typedef {Object} Exercise
 * @property {string} _id
 * @property {string} workoutId
 * @property {string} name
 * @property {string} muscleGroup
 * @property {number} order
 * @property {Object} targets
 * @property {string} [videoUrl]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} WorkoutLog
 * @property {string} _id
 * @property {string} clientId
 * @property {string} workoutId
 * @property {string} programId
 * @property {number} weekNumber
 * @property {Date} date
 * @property {boolean} isCompleted
 * @property {Array} exercises
 */
