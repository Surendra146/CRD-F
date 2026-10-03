import { apiWrapper } from '../config';

const DASHBOARDS_URL = '/api/dashboards';

/**
 * dashboardsApi
 *
 * Stub service preserved after custom dashboard files were removed.
 * These endpoints previously managed custom dashboard CRUD.
 * Kept as stubs so that api.js re-exports and any remaining
 * consumers do not break at import time.
 */
export const dashboardsApi = {
  getAll: async () =>
    apiWrapper({ url: DASHBOARDS_URL, method: 'GET' }),

  getById: async (id) =>
    apiWrapper({ url: `${DASHBOARDS_URL}/${id}`, method: 'GET' }),

  create: async (data) =>
    apiWrapper({ url: DASHBOARDS_URL, method: 'POST', data }),

  update: async (id, data) =>
    apiWrapper({ url: `${DASHBOARDS_URL}/${id}`, method: 'PATCH', data }),

  remove: async (id) =>
    apiWrapper({ url: `${DASHBOARDS_URL}/${id}`, method: 'DELETE' }),
};
