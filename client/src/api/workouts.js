import api from './axios';

export const getWorkouts = (programId, params) => api.get(`/programs/${programId}/workouts`, { params }).then(r => r.data);
export const getWorkout = (id) => api.get(`/workouts/${id}`).then(r => r.data);
export const createWorkout = (programId, data) => api.post(`/programs/${programId}/workouts`, data).then(r => r.data);
export const updateWorkout = (id, data) => api.patch(`/workouts/${id}`, data).then(r => r.data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`).then(r => r.data);
