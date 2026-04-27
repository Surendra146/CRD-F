import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const UPLOADS_URL = `${BASE_URL}/api/uploads`;

export const uploadsApi = {
  upload: async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return fetchWrapper(UPLOADS_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  suggestMappings: async (columns, type) => {
    return fetchWrapper(`${UPLOADS_URL}/suggest-mappings`, {
      method: 'POST',
      body: JSON.stringify({ columns, type }),
    });
  },

  getTargetFields: async (type) => {
    return fetchWrapper(`${UPLOADS_URL}/target-fields`, {
      method: 'GET',
      params: { type },
    });
  },

  setMapping: async (uploadId, columnMapping) => {
    return fetchWrapper(`${UPLOADS_URL}/${uploadId}/mapping`, {
      method: 'PUT',
      body: JSON.stringify({ columnMapping }),
    });
  },

  process: async (uploadId) => {
    return fetchWrapper(`${UPLOADS_URL}/${uploadId}/process`, {
      method: 'POST',
    });
  },

  getStatus: async (uploadId) => {
    return fetchWrapper(`${UPLOADS_URL}/${uploadId}/status`, {
      method: 'GET',
    });
  },

  getHistory: async (params = {}) => {
    return fetchWrapper(`${UPLOADS_URL}/history`, {
      method: 'GET',
      params,
    });
  },
};
