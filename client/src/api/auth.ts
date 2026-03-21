import api from './axios';

export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const register = (data) => api.post('/auth/register', data).then(r => r.data);
export const getMe = (id) => api.get(`/auth/me/${id}`).then(r => r.data);
