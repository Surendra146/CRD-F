import api from '../config/api';

export const notificationsApi = {
  getAll: () => api.get('/api/notifications'),
};
