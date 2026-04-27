import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const NOTIFICATIONS_URL = `${BASE_URL}/api/notifications`;

export const notificationsApi = {
  getAll: async (params = {}) => {
    return fetchWrapper(NOTIFICATIONS_URL, {
      method: 'GET',
      params,
    });
  },
};
