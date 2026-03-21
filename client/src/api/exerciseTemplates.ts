import api from './axios';

export const getExerciseTemplates = (params) => api.get('/exercise-templates', { params }).then(r => r.data);
export const getExerciseTemplate = (id) => api.get(`/exercise-templates/${id}`).then(r => r.data);
