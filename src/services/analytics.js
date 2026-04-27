import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const ANALYTICS_URL = `${BASE_URL}/api/analytics`;

export const analyticsApi = {
  getDashboard: async () => fetchWrapper(`${ANALYTICS_URL}/dashboard`, { method: 'GET' }),

  getSegments: async () => fetchWrapper(`${ANALYTICS_URL}/segments`, { method: 'GET' }),

  getCohorts: async (params = {}) =>
    fetchWrapper(`${ANALYTICS_URL}/cohorts`, {
      method: 'GET',
      params,
    }),

  getChurn: async () => fetchWrapper(`${ANALYTICS_URL}/churn`, { method: 'GET' }),

  getRevenue: async (params = {}) =>
    fetchWrapper(`${ANALYTICS_URL}/revenue`, {
      method: 'GET',
      params,
    }),

  recalculateScores: async () =>
    fetchWrapper(`${ANALYTICS_URL}/recalculate`, {
      method: 'POST',
    }),
};

export const customDashboardAnalyticsApi = {
  getFilters: async (dashboardId) =>
    fetchWrapper(`${ANALYTICS_URL}/${dashboardId}/filters`, {
      method: 'GET',
    }),

  getData: async (dashboardId, params = {}) =>
    fetchWrapper(`${ANALYTICS_URL}/${dashboardId}`, {
      method: 'GET',
      params,
    }),
};