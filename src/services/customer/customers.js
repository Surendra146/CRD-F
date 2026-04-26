import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const CUSTOMERS_URL = `${BASE_URL}/api/customers`;

export const customersApi = {
  getAll: async (params = {}) => {
    return fetchWrapper(CUSTOMERS_URL, {
      method: 'GET',
      params,
    });
  },

  getById: async (customerId) => {
    return fetchWrapper(`${CUSTOMERS_URL}/${customerId}`, {
      method: 'GET',
    });
  },

  create: async (customerData) => {
    return fetchWrapper(CUSTOMERS_URL, {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  update: async (customerId, customerData) => {
    return fetchWrapper(`${CUSTOMERS_URL}/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  delete: async (customerId) => {
    return fetchWrapper(`${CUSTOMERS_URL}/${customerId}`, {
      method: 'DELETE',
    });
  },

  getTimeline: async (customerId) => {
    return fetchWrapper(`${CUSTOMERS_URL}/${customerId}/timeline`, {
      method: 'GET',
    });
  },

  addInteraction: async (customerId, interactionData) => {
    return fetchWrapper(`${CUSTOMERS_URL}/${customerId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(interactionData),
    });
  },
};