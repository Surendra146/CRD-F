import { apiWrapper } from '../config';

const DASHBOARDS_URL = '/api/dashboards';

export const dashboardsApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: DASHBOARDS_URL,
      method: 'GET',
      params,
    });
  },

  getById: async (id) => {
    return apiWrapper({
      url: `${DASHBOARDS_URL}/${id}`,
      method: 'GET',
    });
  },

  create: async (data) => {
    return apiWrapper({
      url: DASHBOARDS_URL,
      method: 'POST',
      data,
    });
  },

  update: async (id, data) => {
    return apiWrapper({
      url: `${DASHBOARDS_URL}/${id}`,
      method: 'PUT',
      data,
    });
  },

  delete: async (id) => {
    return apiWrapper({
      url: `${DASHBOARDS_URL}/${id}`,
      method: 'DELETE',
    });
  },
};