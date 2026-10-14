export const progressSteps = ['requested', 'accepted', 'setup_in_progress', 'action_required', 'connected'];
export const activeStatuses = new Set(['requested', 'accepted', 'setup_in_progress', 'action_required', 'connected', 'ready', 'needs_customer_action', 'provider_review', 'billing_pending']);
export const statusLabel = (value = '') => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function internationalPhone(countryCode, phone) {
  if (!/^\+?[1-9]\d{0,2}$/.test(countryCode.trim())) throw new Error('Enter a valid country calling code');
  if (!/^[\d ().-]+$/.test(phone.trim())) throw new Error('Enter a valid national phone number');
  const value = countryCode.replace('+', '').trim() + phone.replace(/\D/g, '');
  if (!/^[1-9]\d{7,14}$/.test(value)) throw new Error('Enter a valid phone number including country code');
  return value;
}

export function subscriptionDialog(error) {
  const detail = error?.response?.data?.detail;
  if (!['SUBSCRIPTION_NOT_FOUND', 'SUBSCRIPTION_NOT_ACTIVE', 'SUBSCRIPTION_EXPIRED', 'WHATSAPP_ENTITLEMENT_REQUIRED'].includes(detail?.code)) return null;
  return { title: detail.code === 'WHATSAPP_ENTITLEMENT_REQUIRED' ? 'WhatsApp Feature Not Included' : 'Active Subscription Required', message: detail.message };
}

export function filterRequests(rows, search, status, subscription) {
  const term = search.trim().toLowerCase();
  return rows.filter((row) => (!term || `${row.tenant_name || ''} ${row.business_name} ${row.organization_id}`.toLowerCase().includes(term))
    && (!status || row.status === status) && (!subscription || row.subscription_status === subscription));
}
