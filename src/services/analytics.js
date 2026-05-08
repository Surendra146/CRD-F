import { apiWrapper } from '../config';

const ANALYTICS_URL = '/api/analytics';

export const analyticsApi = {
  getDashboard: async (params = {}) =>
    apiWrapper({
      url: `${ANALYTICS_URL}/dashboard`,
      method: 'GET',
      params,
    }),

  getSegments: async () =>
    apiWrapper({
      url: `${ANALYTICS_URL}/segments`,
      method: 'GET',
    }),

  getCohorts: async (params = {}) =>
    apiWrapper({
      url: `${ANALYTICS_URL}/cohorts`,
      method: 'GET',
      params,
    }),

  getChurn: async () =>
    apiWrapper({
      url: `${ANALYTICS_URL}/churn`,
      method: 'GET',
    }),

  getRevenue: async (params = {}) =>
    apiWrapper({
      url: `${ANALYTICS_URL}/revenue`,
      method: 'GET',
      params,
    }),

  recalculateScores: async () =>
    apiWrapper({
      url: `${ANALYTICS_URL}/recalculate`,
      method: 'POST',
    }),
};

export const customDashboardAnalyticsApi = {
  getFilters: async (dashboardId) =>
    apiWrapper({
      url: `${ANALYTICS_URL}/${dashboardId}/filters`,
      method: 'GET',
    }),

  getData: async (dashboardId, params = {}) =>
    apiWrapper({
      url: `${ANALYTICS_URL}/${dashboardId}`,
      method: 'GET',
      params,
    }),
};
