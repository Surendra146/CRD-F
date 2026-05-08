import { apiWrapper } from '../config';

const CUSTOMERS_URL = '/api/customers';

export const customersApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: CUSTOMERS_URL,
      method: 'GET',
      params,
    });
  },

  getById: async (customerId) => {
    return apiWrapper({
      url: `${CUSTOMERS_URL}/${customerId}`,
      method: 'GET',
    });
  },

  create: async (customerData) => {
    return apiWrapper({
      url: CUSTOMERS_URL,
      method: 'POST',
      data: customerData,
    });
  },

  update: async (customerId, customerData) => {
    return apiWrapper({
      url: `${CUSTOMERS_URL}/${customerId}`,
      method: 'PUT',
      data: customerData,
    });
  },

  delete: async (customerId) => {
    return apiWrapper({
      url: `${CUSTOMERS_URL}/${customerId}`,
      method: 'DELETE',
    });
  },

  getTimeline: async (customerId) => {
    return apiWrapper({
      url: `${CUSTOMERS_URL}/${customerId}/timeline`,
      method: 'GET',
    });
  },

  addInteraction: async (customerId, interactionData) => {
    return apiWrapper({
      url: `${CUSTOMERS_URL}/${customerId}/interactions`,
      method: 'POST',
      data: interactionData,
    });
  },
};