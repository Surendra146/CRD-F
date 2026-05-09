import { apiWrapper } from '../config';

const CAMPAIGNS_URL = '/api/campaigns';

export const campaignsApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: CAMPAIGNS_URL,
      method: 'GET',
      params,
    });
  },

  getById: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}`,
      method: 'GET',
    });
  },

  create: async (campaignData) => {
    return apiWrapper({
      url: CAMPAIGNS_URL,
      method: 'POST',
      data: campaignData,
    });
  },

  update: async (campaignId, campaignData) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}`,
      method: 'PUT',
      data: campaignData,
    });
  },

  delete: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}`,
      method: 'DELETE',
    });
  },

  launch: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}/launch`,
      method: 'POST',
    });
  },

  // Backward-compatible alias
  start: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}/launch`,
      method: 'POST',
    });
  },

  pause: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}/pause`,
      method: 'POST',
    });
  },

  resume: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}/resume`,
      method: 'POST',
    });
  },

  complete: async (campaignId) => {
    return apiWrapper({
      url: `${CAMPAIGNS_URL}/${campaignId}/complete`,
      method: 'POST',
    });
  },
};
