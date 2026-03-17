import api from './axios';

export const getWorkoutLogs = (params) => api.get('/workout-logs', { params }).then(r => r.data);
export const getWorkoutLog = (id) => api.get(`/workout-logs/${id}`).then(r => r.data);
export const createWorkoutLog = (data) => api.post('/workout-logs', data).then(r => r.data);
export const updateWorkoutLog = (id, data) => api.patch(`/workout-logs/${id}`, data).then(r => r.data);
export const getPreviousLog = (params) => api.get('/workout-logs/previous', { params }).then(r => r.data);
