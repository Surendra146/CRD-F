import { apiWrapper } from '../config';

const AUTH_URL = '/api/auth';

export const authApi = {
  /* =========================
     AUTH
  ========================= */
  login: async (email, password) => {
    return apiWrapper({
      url: `${AUTH_URL}/login`,
      method: 'POST',
      data: { email, password },
    });
  },

  register: async (data) => {
    return apiWrapper({
      url: `${AUTH_URL}/register`,
      method: 'POST',
      data,
    });
  },

  verifyPhoneOtp: async (otp) => {
    return apiWrapper({
      url: `${AUTH_URL}/verify-phone-otp`,
      method: 'POST',
      data: { otp },
    });
  },

  /* =========================
     USER / ORG
  ========================= */
  getMe: async () => {
    return apiWrapper({
      url: `${AUTH_URL}/me`,
      method: 'GET',
    });
  },

  getOrganizationSettings: async () => {
    return apiWrapper({
      url: `${AUTH_URL}/organization-settings`,
      method: 'GET',
    });
  },

  updateOrganizationSettings: async (data) => {
    return apiWrapper({
      url: `${AUTH_URL}/organization-settings`,
      method: 'PATCH',
      data,
    });
  },

  /* =========================
     MEMBERS
  ========================= */
  getMembers: async () => {
    return apiWrapper({
      url: `${AUTH_URL}/members`,
      method: 'GET',
    });
  },

  createMember: async (data) => {
    return apiWrapper({
      url: `${AUTH_URL}/members`,
      method: 'POST',
      data,
    });
  },

  updateMember: async (userId, data) => {
    return apiWrapper({
      url: `${AUTH_URL}/members/${userId}`,
      method: 'PATCH',
      data,
    });
  },

  updateMemberRole: async (userId, role) => {
    return apiWrapper({
      url: `${AUTH_URL}/members/${userId}/role`,
      method: 'PATCH',
      data: { role },
    });
  },

  updateMemberAccess: async (userId, data) => {
    return apiWrapper({
      url: `${AUTH_URL}/members/${userId}/role`,
      method: 'PATCH',
      data,
    });
  },

  /* =========================
     ROLES
  ========================= */
  getRoles: async () => {
    return apiWrapper({
      url: `${AUTH_URL}/roles`,
      method: 'GET',
    });
  },

  createRole: async (data) => {
    return apiWrapper({
      url: `${AUTH_URL}/roles`,
      method: 'POST',
      data,
    });
  },

  updateRole: async (roleKey, data) => {
    return apiWrapper({
      url: `${AUTH_URL}/roles/${roleKey}`,
      method: 'PATCH',
      data,
    });
  },
};