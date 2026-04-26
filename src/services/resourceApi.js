import api from '../config/api';

const normalizePath = (path = '') => {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
};

export const buildPath = (basePath, ...segments) =>
  [basePath, ...segments]
    .filter((segment) => segment !== undefined && segment !== null && segment !== '')
    .map((segment) => normalizePath(String(segment)).replace(/\/$/, ''))
    .join('');

export const createResourceApi = (basePath, customActions = {}) => ({
  getAll: (params) => api.get(basePath, { params }),
  getById: (id) => api.get(buildPath(basePath, id)),
  create: (data) => api.post(basePath, data),
  update: (id, data) => api.put(buildPath(basePath, id), data),
  delete: (id) => api.delete(buildPath(basePath, id)),
  ...customActions,
});
