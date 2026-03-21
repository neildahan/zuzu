import api from './axios';

export const getPrograms = (params) => api.get('/programs', { params }).then(r => r.data);
export const getProgram = (id) => api.get(`/programs/${id}`).then(r => r.data);
export const createProgram = (data) => api.post('/programs', data).then(r => r.data);
export const updateProgram = (id, data) => api.patch(`/programs/${id}`, data).then(r => r.data);
export const deleteProgram = (id) => api.delete(`/programs/${id}`).then(r => r.data);
