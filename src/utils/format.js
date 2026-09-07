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
  return new Intl.NumberFormat('en-US').format(Number.isFinite(Number(num)) ? Number(num) : 0);
}

export function parseValidDate(date) {
  if (!date) return null;

  const parsedDate = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatDate(date, formatStr = 'MMM dd, yyyy', fallback = 'N/A') {
  const parsedDate = parseValidDate(date);
  return parsedDate ? format(parsedDate, formatStr) : fallback;
}

export function formatRelativeTime(date, fallback = 'N/A') {
  const parsedDate = parseValidDate(date);
  return parsedDate ? formatDistanceToNow(parsedDate, { addSuffix: true }) : fallback;
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
    champions: '#10B981',
    loyal_customers: '#3B82F6',
    potential_loyalist: '#06B6D4',
    new_customers: '#8B5CF6',
    promising: '#6366F1',
    need_attention: '#F59E0B',
    about_to_sleep: '#F97316',
    at_risk: '#F87171',
    cant_lose: '#DC2626',
    hibernating: '#9CA3AF',
    lost: '#4B5563',
  };
  return colors[segment] || '#64748B';
}

export function truncate(str, length = 30) {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
}
