import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const CAMPAIGNS_URL = `${BASE_URL}/api/campaigns`;

export const campaignsApi = {
  getAll: async (params = {}) => {
    return fetchWrapper(CAMPAIGNS_URL, {
      method: 'GET',
      params,
    });
  },

  getById: async (campaignId) => {
    return fetchWrapper(`${CAMPAIGNS_URL}/${campaignId}`, {
      method: 'GET',
    });
  },

  create: async (campaignData) => {
    return fetchWrapper(CAMPAIGNS_URL, {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  },

  update: async (campaignId, campaignData) => {
    return fetchWrapper(`${CAMPAIGNS_URL}/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    });
  },

  delete: async (campaignId) => {
    return fetchWrapper(`${CAMPAIGNS_URL}/${campaignId}`, {
      method: 'DELETE',
    });
  },

  launch: async (campaignId) => {
    return fetchWrapper(`${CAMPAIGNS_URL}/${campaignId}/launch`, {
      method: 'POST',
    });
  },

  // Backward-compatible alias
  start: async (campaignId) => {
    return fetchWrapper(`${CAMPAIGNS_URL}/${campaignId}/launch`, {
      method: 'POST',
    });
  },

  pause: async (campaignId) => {
    return fetchWrapper(`${CAMPAIGNS_URL}/${campaignId}/pause`, {
      method: 'POST',
    });
  },
};
