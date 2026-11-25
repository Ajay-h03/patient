export function getErrorMessage(error, fallback = 'Something went wrong') {
  const message = error?.response?.data?.message ?? error;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function shortId(id = '') {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function genderLabel(gender) {
  if (gender === 'MALE') return 'Male';
  if (gender === 'FEMALE') return 'Female';
  if (gender === 'OTHER') return 'Other';
  return gender || '—';
}

export function calculateTotals(amount, taxRate) {
  const base = Number(amount);
  const rate = Number(taxRate);
  if (!Number.isFinite(base) || !Number.isFinite(rate)) {
    return { taxAmount: 0, total: 0 };
  }
  const taxAmount = Math.round((base * rate) / 100 * 100) / 100;
  const total = Math.round((base + taxAmount) * 100) / 100;
  return { taxAmount, total };
}
