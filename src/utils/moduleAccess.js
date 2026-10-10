const MODULE_KEY_ALIASES = {
  dashboards: 'dashboard',
  'custom-dashboards': 'dashboard',
  'customer-details': 'customers',
  'customer-sales': 'customers',
  'customer-segment-import': 'campaigns',
  'campaign-master': 'campaigns',
  'reports-parent': 'reports',
  'reports-recent-upload-child': 'reports',
  'custom-dashboards-parent': 'custom-dashboards',
  'custom-dashboards-sales-child': 'custom-dashboards',
  'campaigns-child': 'campaigns',
  'segments-child': 'campaigns',
  'templates-child': 'templates',
  'whatsapp-child': 'whatsapp',
  'whatsapp-gmaps': 'whatsapp',
  'whatsapp-filter': 'whatsapp',
  'whatsapp-bot': 'whatsapp',
  'whatsapp-groups': 'whatsapp',
};

export function normalizeModuleKey(moduleKey) {
  if (!moduleKey) return '';
  return MODULE_KEY_ALIASES[moduleKey] || moduleKey;
}

export function normalizeAllowedModules(modules) {
  const values = Array.isArray(modules) ? modules : [];
  return [...new Set(values.map((item) => normalizeModuleKey(item)).filter(Boolean))];
}

export function moduleAccessKey(module) {
  return normalizeModuleKey(module?.accessKey || module?.key || '');
}
