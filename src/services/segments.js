import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const SEGMENTS_URL = `${BASE_URL}/api/segments`;

export const segmentsApi = {
  getAll: async (params = {}) => {
    return fetchWrapper(SEGMENTS_URL, {
      method: 'GET',
      params,
    });
  },
  create: async (segmentData) => {
    return fetchWrapper(SEGMENTS_URL, {
      method: 'POST',
      body: JSON.stringify(segmentData),
    });
  },

  update: async (segmentId, segmentData) => {
    return fetchWrapper(`${SEGMENTS_URL}/${segmentId}`, {
      method: 'PUT',
      body: JSON.stringify(segmentData),
    });
  },

  delete: async (segmentId) => {
    return fetchWrapper(`${SEGMENTS_URL}/${segmentId}`, {
      method: 'DELETE',
    });
  },
};
