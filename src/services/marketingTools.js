import { apiWrapper } from '../config';

const MARKETING_URL = '/api/marketing';

export const marketingToolsApi = {
  // WhatsApp Number Filter
  filterNumbers: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/filter-numbers`,
      method: 'POST',
      data,
    });
  },

  // Google Maps Lead Extractor
  searchGMaps: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/gmaps-extractor/search`,
      method: 'POST',
      data,
    });
  },

  importGMapsLeads: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/gmaps-extractor/import`,
      method: 'POST',
      data,
    });
  },

  getGMapsHistory: async () => {
    return apiWrapper({
      url: `${MARKETING_URL}/gmaps-extractor/history`,
      method: 'GET',
    });
  },

  // Auto Responder
  getAutoResponderRules: async () => {
    return apiWrapper({
      url: `${MARKETING_URL}/auto-responder`,
      method: 'GET',
    });
  },

  createAutoResponderRule: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/auto-responder`,
      method: 'POST',
      data,
    });
  },

  updateAutoResponderRule: async (ruleId, data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/auto-responder/${ruleId}`,
      method: 'PUT',
      data,
    });
  },

  deleteAutoResponderRule: async (ruleId) => {
    return apiWrapper({
      url: `${MARKETING_URL}/auto-responder/${ruleId}`,
      method: 'DELETE',
    });
  },

  testAutoResponder: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/auto-responder/test`,
      method: 'POST',
      data,
    });
  },

  // WhatsApp Group Tools
  parseGroupLinks: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/group-tools/parse-links`,
      method: 'POST',
      data,
    });
  },

  grabGroupMembers: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/group-tools/grab-members`,
      method: 'POST',
      data,
    });
  },

  importGroupMembers: async (data) => {
    return apiWrapper({
      url: `${MARKETING_URL}/group-tools/import-members`,
      method: 'POST',
      data,
    });
  },
};
