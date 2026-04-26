import api from './api';
import { buildPath } from './resourceApi';

const basePath = '/api/analytics';

export const analyticsApi = {
  getDashboard: () => api.get(buildPath(basePath, 'dashboard')),
  getSegments: () => api.get(buildPath(basePath, 'segments')),
  getCohorts: (params) => api.get(buildPath(basePath, 'cohorts'), { params }),
  getChurn: () => api.get(buildPath(basePath, 'churn')),
  getRevenue: (params) => api.get(buildPath(basePath, 'revenue'), { params }),
  recalculateScores: () => api.post(buildPath(basePath, 'recalculate')),
};

export const customDashboardAnalyticsApi = {
  getFilters: (dashboardId) => api.get(buildPath(basePath, dashboardId, 'filters')),
  getData: (dashboardId, params) => api.get(buildPath(basePath, dashboardId), { params }),
};
