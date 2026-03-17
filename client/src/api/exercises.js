import api from './axios';

export const getExercises = (workoutId) => api.get(`/workouts/${workoutId}/exercises`).then(r => r.data);
export const createExercise = (workoutId, data) => api.post(`/workouts/${workoutId}/exercises`, data).then(r => r.data);
export const updateExercise = (id, data) => api.patch(`/exercises/${id}`, data).then(r => r.data);
export const deleteExercise = (id) => api.delete(`/exercises/${id}`).then(r => r.data);
export const reorderExercises = (workoutId, orderedIds) => api.patch(`/workouts/${workoutId}/exercises/reorder`, { orderedIds }).then(r => r.data);
