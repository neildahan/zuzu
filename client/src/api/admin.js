import api from './axios';

export const getAdminStats = () => api.get('/admin/stats').then(r => r.data);
export const getAdminUsers = (params) => api.get('/admin/users', { params }).then(r => r.data);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data);
export const updateAdminUser = (id, data) => api.patch(`/admin/users/${id}`, data).then(r => r.data);
export const getAdminPrograms = (params) => api.get('/admin/programs', { params }).then(r => r.data);
export const getAdminWorkoutLogs = (params) => api.get('/admin/workout-logs', { params }).then(r => r.data);
export const createExerciseTemplate = (data) => api.post('/admin/exercise-templates', data).then(r => r.data);
export const updateExerciseTemplate = (id, data) => api.patch(`/admin/exercise-templates/${id}`, data).then(r => r.data);
export const deleteExerciseTemplate = (id) => api.delete(`/admin/exercise-templates/${id}`).then(r => r.data);
