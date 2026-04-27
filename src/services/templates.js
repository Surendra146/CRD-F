import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const TEMPLATES_URL = `${BASE_URL}/api/templates`;

export const templatesApi = {
  getAll: async (params = {}) => {
    return fetchWrapper(TEMPLATES_URL, {
      method: 'GET',
      params,
    });
  },

  getById: async (templateId) => {
    return fetchWrapper(`${TEMPLATES_URL}/${templateId}`, {
      method: 'GET',
    });
  },

  create: async (templateData) => {
    return fetchWrapper(TEMPLATES_URL, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  update: async (templateId, templateData) => {
    return fetchWrapper(`${TEMPLATES_URL}/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },

  delete: async (templateId) => {
    return fetchWrapper(`${TEMPLATES_URL}/${templateId}`, {
      method: 'DELETE',
    });
  },
};
