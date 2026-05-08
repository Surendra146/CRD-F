import { apiWrapper } from '../config';

const NOTIFICATIONS_URL = '/api/notifications';

export const notificationsApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: NOTIFICATIONS_URL,
      method: 'GET',
      params,
    });
  },
};