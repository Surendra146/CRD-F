import api from '../config/api';
import { buildPath } from './resourceApi';

const basePath = '/api/auth';

export const authApi = {
  login: (email, password) => api.post(buildPath(basePath, 'login'), { email, password }),
  register: (data) => api.post(buildPath(basePath, 'register'), data),
  verifyPhoneOtp: (otp) => api.post(buildPath(basePath, 'verify-phone-otp'), { otp }),
  getMe: () => api.get(buildPath(basePath, 'me')),
  getOrganizationSettings: () => api.get(buildPath(basePath, 'organization-settings')),
  updateOrganizationSettings: (data) => api.patch(buildPath(basePath, 'organization-settings'), data),
  getMembers: () => api.get(buildPath(basePath, 'members')),
  getRoles: () => api.get(buildPath(basePath, 'roles')),
  createRole: (data) => api.post(buildPath(basePath, 'roles'), data),
  updateRole: (roleKey, data) => api.patch(buildPath(basePath, 'roles', roleKey), data),
  createMember: (data) => api.post(buildPath(basePath, 'members'), data),
  updateMember: (userId, data) => api.patch(buildPath(basePath, 'members', userId), data),
  updateMemberRole: (userId, role) =>
    api.patch(buildPath(basePath, 'members', userId, 'role'), { role }),
  updateMemberAccess: (userId, data) =>
    api.patch(buildPath(basePath, 'members', userId, 'role'), data),
};
