import api from '../config/apiConfig';

export const saasApi = {
  profile: () => api.get('/api/saas/profile'),
  updateProfile: (data) => api.put('/api/saas/profile', data),
  plans: () => api.get('/api/saas/plans'),
  subscription: () => api.get('/api/saas/subscription'),
  invoices: () => api.get('/api/saas/invoices'),
  usage: () => api.get('/api/saas/usage'),
  onboarding: () => api.get('/api/saas/onboarding'),
  requestOnboarding: (data) => api.post('/api/saas/onboarding', data),
  numbers: () => api.get('/api/saas/numbers'),
  defaultNumber: (id) => api.post(`/api/saas/numbers/${encodeURIComponent(id)}/default`),
  disconnectNumber: (id) => api.delete(`/api/saas/numbers/${encodeURIComponent(id)}`),
  syncTemplates: () => api.post('/api/saas/templates/sync'),
  consents: () => api.get('/api/saas/consents'),
  setConsent: (data) => api.post('/api/saas/consents', data),
  messages: () => api.get('/api/saas/messages'),
};

export const platformApi = {
  subscriptions: () => api.get('/api/platform/subscriptions'),
  organizations: () => api.get('/api/platform/organizations'),
  subscriptionPlans: () => api.get('/api/platform/subscription-plans'),
  manageSubscription: (tenantId, organizationId, operation, data) => api.post(
    `/api/platform/tenants/${tenantId}/organizations/${organizationId}/subscription/${operation}`, data),
  access: () => api.get('/api/platform/access'),
  overview: () => api.get('/api/platform/overview'),
  tenants: () => api.get('/api/platform/tenants'),
  setTenant: (id, is_active) => api.patch(`/api/platform/tenants/${id}`, { is_active }),
  plans: () => api.get('/api/platform/plans'),
  createPlan: (data) => api.post('/api/platform/plans', data),
  onboarding: () => api.get('/api/platform/onboarding'),
  updateOnboarding: (id, data) => api.patch(`/api/platform/onboarding/${encodeURIComponent(id)}`, data),
  audit: () => api.get('/api/platform/audit'),
};
