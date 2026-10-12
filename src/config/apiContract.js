export function resolveBackendUrl(env = {}) {
  const configured = (env.VITE_BACKEND_URL || env.VITE_API_URL || '').trim();
  const origin = configured || (env.PROD ? '' : 'http://localhost:8000');
  // Service paths already include /api. Accept old environment values ending in /api.
  return origin.replace(/\/+$/, '').replace(/\/api$/, '');
}

export function validateRenderApiOrigin(env) {
  const origin = resolveBackendUrl(env);
  let url;
  try { url = new URL(origin); } catch { /* Validated below. */ }
  if (!url || url.protocol !== 'https:' || /^(localhost|127\.|\[?::1\]?)/.test(url.hostname) ||
      url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('Render requires VITE_BACKEND_URL (or VITE_API_URL) to be the public HTTPS backend origin.');
  }
  return origin;
}

export function formatApiError(error) {
  const body = error?.response?.data;
  const detail = body?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const field = (item.loc || []).filter((part) => !['body', 'query', 'path'].includes(part)).join('.');
      return `${field ? `${field}: ` : ''}${item.msg || 'Invalid value'}`;
    }).join('; ');
  }
  return (typeof detail === 'string' ? detail : detail?.provider_message || detail?.message) ||
    body?.message || body?.error || error?.message || 'Something went wrong';
}

export function campaignSchedule(date, time) {
  if (!date && !time) return undefined;
  if (!date || !time) throw new Error('Choose both a campaign date and time');
  // The campaign form explicitly uses Asia/Kolkata, regardless of the browser timezone.
  const scheduled = new Date(`${date}T${time}:00+05:30`);
  if (!Number.isFinite(scheduled.getTime()) || scheduled <= new Date()) {
    throw new Error('Campaign date and time must be in the future');
  }
  return { scheduledAt: scheduled.toISOString(), timezone: 'Asia/Kolkata' };
}
