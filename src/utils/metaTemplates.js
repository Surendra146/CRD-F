export function isSupportedApprovedTemplate(template, wabaId) {
  const approved = template?.workflow?.approved;
  if (!approved || template.isActive === false || template.is_active === false || template.stats?.meta_status !== 'APPROVED') return false;
  if (approved.waba_id !== wabaId || !['UTILITY', 'MARKETING'].includes(approved.category)) return false;
  const parts = approved.components || [];
  return parts.some(p => p.type === 'BODY') && parts.every(p => {
    if (!['HEADER', 'BODY', 'FOOTER', 'BUTTONS'].includes(p.type)) return false;
    if (p.type === 'HEADER' && !['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].includes(p.format)) return false;
    if (/\{\{\s*[a-zA-Z_]/.test(p.text || '')) return false;
    return p.type !== 'BUTTONS' || (p.buttons || []).every(b => ['URL', 'PHONE_NUMBER', 'QUICK_REPLY'].includes(b.type));
  });
}
