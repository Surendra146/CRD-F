import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount, currency = 'INR', options = {}) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    ...options,
  }).format(amount);
}

export function formatCompactCurrency(amount, currency = 'INR') {
  return formatCurrency(amount, currency, {
    maximumFractionDigits: 1,
    notation: 'compact',
  });
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  return format(new Date(date), formatStr);
}

export function formatRelativeTime(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    churned: 'bg-red-100 text-red-800',
    loyal: 'bg-blue-100 text-blue-800',
    new: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSegmentColor(segment) {
  const colors = {
    champions: 'bg-emerald-500',
    loyal_customers: 'bg-blue-500',
    potential_loyalist: 'bg-cyan-500',
    new_customers: 'bg-purple-500',
    promising: 'bg-indigo-500',
    need_attention: 'bg-yellow-500',
    about_to_sleep: 'bg-orange-500',
    at_risk: 'bg-red-400',
    cant_lose: 'bg-red-600',
    hibernating: 'bg-gray-400',
    lost: 'bg-gray-600',
  };
  return colors[segment] || 'bg-gray-500';
}

export function truncate(str, length = 30) {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
}
