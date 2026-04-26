import api from './api';
import { buildPath } from './resourceApi';

const basePath = '/api/uploads';

export const uploadsApi = {
  upload: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return api.post(basePath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  suggestMappings: (columns, type) => api.post(buildPath(basePath, 'suggest-mappings'), { columns, type }),

  getTargetFields: (type) => api.get(buildPath(basePath, 'target-fields'), { params: { type } }),

  setMapping: (uploadId, columnMapping) =>
    api.put(buildPath(basePath, uploadId, 'mapping'), { columnMapping }),

  process: (uploadId) => api.post(buildPath(basePath, uploadId, 'process')),

  getStatus: (uploadId) => api.get(buildPath(basePath, uploadId, 'status')),

  getHistory: (params) => api.get(buildPath(basePath, 'history'), { params }),
};
