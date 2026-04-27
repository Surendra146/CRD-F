import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const DASHBOARDS_URL = `${BASE_URL}/api/dashboards`;

export const dashboardsApi = {
  getAll: async (params = {}) => {
    return fetchWrapper(DASHBOARDS_URL, {
      method: 'GET',
      params,
    });
  },

  getById: async (id) => {
    return fetchWrapper(`${DASHBOARDS_URL}/${id}`, {
      method: 'GET',
    });
  },

  create: async (data) => {
    return fetchWrapper(DASHBOARDS_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return fetchWrapper(`${DASHBOARDS_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return fetchWrapper(`${DASHBOARDS_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
