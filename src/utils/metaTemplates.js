export function isSupportedApprovedTemplate(template, wabaId) {
  const approved = template?.workflow?.approved;
  if (!approved || template.isActive === false || template.is_active === false || template.stats?.meta_status !== 'APPROVED') return false;
  if (approved.waba_id !== wabaId || !['UTILITY', 'MARKETING'].includes(approved.category)) return false;
  const parts = approved.components || [];
  return parts.some(p => p.type === 'BODY') && parts.every(p => {
    if (!['HEADER', 'BODY', 'FOOTER', 'BUTTONS'].includes(p.type)) return false;
    if (p.type === 'HEADER' && !['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].includes(p.format)) return false;
    return p.type !== 'BUTTONS' || (p.buttons || []).every(b => ['URL', 'PHONE_NUMBER', 'QUICK_REPLY', 'COPY_CODE'].includes(b.type));
  });
}

export function templateRejectionReason(value) {
  const reason = String(value ?? '').trim();
  return ['', 'none', 'null', 'undefined'].includes(reason.toLowerCase()) ? null : reason;
}

export function templatePreview(definition, recipient = {}, mappings = {}) {
  const components = definition?.components || [];
  const value = field => {
    if (field && typeof field === 'object') return field.value;
    const key = String(field || '').replace(/^customer\./, '');
    if (key === 'city') return recipient.city || recipient.demographics?.city;
    return key.split('.').reduce((result, part) => result?.[part], recipient);
  };
  const render = (text, scope) => {
    const keys = [...new Set(String(text || '').match(/\{\{\s*([a-zA-Z_][\w.]*|[1-9]\d*)\s*\}\}/g) || [])].map(token => token.slice(2, -2).trim());
    return String(text || '').replace(/\{\{\s*([a-zA-Z_][\w.]*|[1-9]\d*)\s*\}\}/g, (token, key) => {
      const index = /^\d+$/.test(key) ? Number(key) - 1 : keys.indexOf(key);
      const field = mappings[scope]?.[index] || definition?.parameters?.[scope]?.[index]?.field;
      return value(field) ?? token;
    });
  };
  const header = components.find(c => c.type === 'HEADER');
  return {
    header: header?.format === 'TEXT' ? render(header.text, 'header') : '',
    body: render(components.find(c => c.type === 'BODY')?.text, 'body'),
    footer: components.find(c => c.type === 'FOOTER')?.text || '',
    buttons: (components.find(c => c.type === 'BUTTONS')?.buttons || []).map((button, index) => ({
      ...button, url: render(button.url, `button_${index}`), type: button.type.toLowerCase(),
    })),
  };
}
