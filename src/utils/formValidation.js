const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export const validateBySchema = (values, schema = {}) => {
  for (const [field, rules] of Object.entries(schema)) {
    const rawValue = values?.[field];
    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${rules.label || field} is required`;
    }

    if (rules.minLength && String(value || '').length < rules.minLength) {
      return `${rules.label || field} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && String(value || '').length > rules.maxLength) {
      return `${rules.label || field} must be at most ${rules.maxLength} characters`;
    }

    if (rules.type === 'email' && value && !isEmail(value)) {
      return `Please enter a valid ${String(rules.label || field).toLowerCase()}`;
    }
  }

  return null;
};

