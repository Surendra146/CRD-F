import { apiWrapper } from '../config';

const SEGMENTS_URL = '/api/segments';

export const segmentsApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: SEGMENTS_URL,
      method: 'GET',
      params,
    });
  },

  create: async (segmentData) => {
    return apiWrapper({
      url: SEGMENTS_URL,
      method: 'POST',
      data: segmentData,
    });
  },

  update: async (segmentId, segmentData) => {
    return apiWrapper({
      url: `${SEGMENTS_URL}/${segmentId}`,
      method: 'PUT',
      data: segmentData,
    });
  },

  delete: async (segmentId) => {
    return apiWrapper({
      url: `${SEGMENTS_URL}/${segmentId}`,
      method: 'DELETE',
    });
  },
};