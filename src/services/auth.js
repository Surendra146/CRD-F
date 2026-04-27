import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const AUTH_URL = `${BASE_URL}/api/auth`;

export const authApi = {
  /* =========================
     AUTH
  ========================= */
  login: async (email, password) => {
    return fetchWrapper(`${AUTH_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data) => {
    return fetchWrapper(`${AUTH_URL}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyPhoneOtp: async (otp) => {
    return fetchWrapper(`${AUTH_URL}/verify-phone-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  },

  /* =========================
     USER / ORG
  ========================= */
  getMe: async () => {
    return fetchWrapper(`${AUTH_URL}/me`, {
      method: 'GET',
    });
  },

  getOrganizationSettings: async () => {
    return fetchWrapper(`${AUTH_URL}/organization-settings`, {
      method: 'GET',
    });
  },

  updateOrganizationSettings: async (data) => {
    return fetchWrapper(`${AUTH_URL}/organization-settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /* =========================
     MEMBERS
  ========================= */
  getMembers: async () => {
    return fetchWrapper(`${AUTH_URL}/members`, {
      method: 'GET',
    });
  },

  createMember: async (data) => {
    return fetchWrapper(`${AUTH_URL}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMember: async (userId, data) => {
    return fetchWrapper(`${AUTH_URL}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateMemberRole: async (userId, role) => {
    return fetchWrapper(`${AUTH_URL}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  updateMemberAccess: async (userId, data) => {
    return fetchWrapper(`${AUTH_URL}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /* =========================
     ROLES
  ========================= */
  getRoles: async () => {
    return fetchWrapper(`${AUTH_URL}/roles`, {
      method: 'GET',
    });
  },

  createRole: async (data) => {
    return fetchWrapper(`${AUTH_URL}/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRole: async (roleKey, data) => {
    return fetchWrapper(`${AUTH_URL}/roles/${roleKey}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};