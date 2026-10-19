import { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import Modal from '../../components/UI/modal.jsx';
import { templatesApi } from '../../services/templates.js';
import { saasApi } from '../../services/saas.js';
import { useAuthStore } from '../../store/authstore.js';

const fields = ['name', 'phone', 'email', 'city', 'lifecycle.segment', 'lifecycle.totalSpent', 'demographics.city'];
const blank = () => ({ name: '', category: 'MARKETING', content: { meta_name: '', language: 'en_US', sender_phone_number_id: '', header: { type: 'NONE' }, body: '', footer: '', buttons: [], mappings: {}, examples: {} } });
const collection = (result) => Array.isArray(result?.data) ? result.data : [];
const errorText = (e) => { const d = e?.response?.data?.detail || e?.message; return typeof d === 'string' ? d : JSON.stringify(d); };
const tokenKeys = (text) => [...new Set([...String(text || '').matchAll(/\{\{\s*([a-zA-Z_][\w.]*|[1-9]\d*)\s*\}\}/g)].map(m => m[1]))];
const control = 'w-full rounded-lg border border-gray-300 bg-white p-2 text-sm';

export function TemplateMediaPreview({ templateId, asset }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true, objectUrl;
    if (templateId && asset?.id) templatesApi.preview(templateId, asset.id).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(() => { if (active) setUrl(''); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [templateId, asset?.id]);
  if (!asset) return null;
  return <div className="space-y-2 text-sm">
    {url && asset.type === 'image' && <img className="max-h-56 w-full rounded-lg object-contain" src={url} alt={asset.name} />}
    {url && asset.type === 'video' && <video className="max-h-56 w-full" src={url} controls />}
    <p>{asset.name} · {(asset.size / 1024).toFixed(0)} KB · {asset.mime}</p>
    {url && asset.type === 'document' && <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Preview PDF</a>}
  </div>;
}

export default function Templates() {
  const client = useQueryClient();
  const { user } = useAuthStore();
  const readOnly = Boolean(user?.role === 'viewer' || user?.readOnly || user?.read_only);
  const templates = useQuery({ queryKey: ['templates'], queryFn: templatesApi.getAll });
  const numbers = useQuery({ queryKey: ['whatsapp-numbers'], queryFn: saasApi.numbers });
  const [open, setOpen] = useState(false), [details, setDetails] = useState(null);
  const [form, setForm] = useState(blank), [id, setId] = useState(null), [assets, setAssets] = useState([]);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const content = form.content;
  const current = collection(templates.data).find(t => t.id === id);
  const submissionPending = ['SUBMITTING', 'SUBMISSION_UNKNOWN', 'PENDING', 'IN_APPEAL'].includes(current?.workflow?.status);
  const setContent = (patch) => setForm(f => ({ ...f, content: { ...f.content, ...patch } }));
  const setHeader = (patch) => setContent({ header: { ...content.header, ...patch } });
  const refreshList = () => client.invalidateQueries({ queryKey: ['templates'] });
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await fn(); await refreshList(); } catch (e) { toast.error(errorText(e)); }
    finally { lock.current = false; setBusy(false); }
  };
  const edit = (row) => {
    const c = row?.content || {}, approved = row?.workflow?.approved;
    const parts = c.components || approved?.components || [];
    const header = parts.find(p => p.type === 'HEADER');
    setId(row?.id || null); setAssets(row?.workflow?.assets || []);
    setForm(row ? { name: row.name, category: ['MARKETING', 'UTILITY'].includes(row.category) ? row.category : 'MARKETING', content: {
      ...blank().content, ...c, meta_name: c.meta_name || row.whatsappTemplateName || '',
      sender_phone_number_id: c.sender_phone_number_id || approved?.sender_phone_number_id || '',
      header: c.header || { type: header?.format || 'NONE', text: header?.text || '' },
      body: c.body || parts.find(p => p.type === 'BODY')?.text || '', footer: c.footer || parts.find(p => p.type === 'FOOTER')?.text || '',
      buttons: c.buttons || parts.find(p => p.type === 'BUTTONS')?.buttons || [],
    } } : blank());
    setOpen(true);
  };
  const persist = async () => {
    if (!form.name.trim()) throw new Error('Enter a local template name');
    const result = id ? await templatesApi.update(id, form) : await templatesApi.create(form);
    setId(result.data.id);
    return result.data.id;
  };
  const upload = (file) => file && run(async () => {
    const templateId = await persist();
    const result = await templatesApi.upload(templateId, file);
    const header = { ...content.header, asset_id: result.data.id };
    const next = { ...form, content: { ...content, header } };
    await templatesApi.update(templateId, next);
    setForm(next); setAssets(a => [...a, result.data]); toast.success('Media uploaded and draft saved');
  });
  const sections = [['header', content.header?.type === 'TEXT' ? content.header.text : ''], ['body', content.body],
    ...content.buttons.map((b, i) => [`button_${i}`, b.type === 'URL' ? b.url : ''])];
  const selectedAsset = assets.find(a => a.id === content.header?.asset_id);
  const exampleText = (text, scope) => String(text || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => content.examples?.[scope]?.[key] || `{{${key}}}`);
  const buttonChange = (i, patch) => setContent({ buttons: content.buttons.map((b, j) => j === i ? { ...b, ...patch } : b) });
  return <div className="space-y-6 p-4 md:p-6">
    <Header title="WhatsApp Templates" subtitle="Create drafts, submit for approval and send the approved version." />
    <div className="flex flex-wrap gap-3">
      {!readOnly && <Button disabled={busy} onClick={() => edit(null)}>Create Template</Button>}
      {!readOnly && <Button disabled={busy} variant="outline" onClick={() => run(async () => { await saasApi.syncTemplates(); toast.success('Templates synchronized'); })}>Synchronize Meta Templates</Button>}
    </div>
    {templates.isError && <p role="alert" className="text-red-700">Unable to load templates. Check your access and retry.</p>}
    {templates.isLoading && <p>Loading templates…</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {collection(templates.data).map(row => {
        const w = row.workflow || {}, approved = w.approved;
        return <article key={row.id} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-3"><h2 className="font-semibold">{row.name}</h2><span className="rounded bg-gray-100 px-2 py-1 text-xs">{w.status || row.stats?.meta_status || 'DRAFT'}</span></div>
          <p className="text-sm text-gray-600">{row.content?.language || approved?.language} · {row.category} · {row.content?.header?.type || approved?.header_type || 'NONE'}</p>
          <p className="break-all text-xs text-gray-500">Account: {row.content?.sender_phone_number_id || approved?.sender_phone_number_id || 'Select in draft'}<br />WABA: {approved?.waba_id || row.targeting?.waba_id || 'Not submitted'}</p>
          {approved && <p className="text-sm text-green-700">Approved for sending: {approved.name} ({approved.language})</p>}
          {w.draft_revision > (w.submitted_revision || 0) && <p className="text-xs text-amber-700">Local draft has unpublished edits</p>}
          {w.rejection_reason && <p role="alert" className="text-sm text-red-700">{w.rejection_reason}</p>}
          {w.submission_error && <p className="text-sm text-amber-700">{w.submission_error}</p>}
          <p className="text-xs text-gray-500">Last sync: {w.synced_at || row.stats?.synced_at || 'Never'}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setDetails(row)}>View Details</Button>
            {!readOnly && <Button size="sm" disabled={busy} onClick={() => edit(row)}>Edit Draft</Button>}
            {!readOnly && (w.submitted || row.targeting?.meta_id) && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => templatesApi.refresh(row.id))}>Refresh Status</Button>}
          </div>
        </article>;
      })}
    </div>
    <Modal isOpen={Boolean(details)} onClose={() => setDetails(null)} title="Template Details" size="lg">
      <p className="mb-3 text-sm">Draft content, approval state and exact approved components:</p><pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap text-xs">{details && JSON.stringify(details, null, 2)}</pre>
    </Modal>
    <Modal isOpen={open} onClose={() => !busy && setOpen(false)} title={id ? 'Edit Template Draft' : 'Create Template Draft'} size="xl">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Editing a draft preserves the approved version. Submitting an edited approved template creates a new Meta name with a revision suffix.</p>
          <label className="block text-sm">Local name<input className={control} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block text-sm">Meta name<input className={control} value={content.meta_name} onChange={e => setContent({ meta_name: e.target.value })} placeholder="welcome_customer" /></label>
          <label className="block text-sm">Sending account / WABA<select className={control} value={content.sender_phone_number_id} onChange={e => setContent({ sender_phone_number_id: e.target.value })}>
            <option value="">Default connected account</option>{collection(numbers.data).filter(n => n.connected).map(n => <option key={n.phone_number_id} value={n.phone_number_id}>{n.display_phone_number || n.phone_number_id} / {n.waba_id}</option>)}
          </select></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm">Language<input className={control} value={content.language} onChange={e => setContent({ language: e.target.value })} /></label>
            <label className="text-sm">Category<select className={control} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>MARKETING</option><option>UTILITY</option></select></label></div>
          <label className="block text-sm">Header type<select className={control} value={content.header?.type || 'NONE'} onChange={e => setContent({ header: { type: e.target.value } })}>{['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map(t => <option key={t}>{t}</option>)}</select></label>
          {content.header?.type === 'TEXT' && <label className="block text-sm">Header text (60 characters)<input className={control} value={content.header.text || ''} onChange={e => setHeader({ text: e.target.value })} /></label>}
          {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(content.header?.type) && <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Approval sample media</p><input disabled={busy} type="file" accept={{ IMAGE: 'image/jpeg,image/png', VIDEO: 'video/mp4', DOCUMENT: 'application/pdf' }[content.header.type]} onChange={e => { upload(e.target.files[0]); e.target.value = ''; }} />
            <select className={control} value={content.header.asset_id || ''} onChange={e => setHeader({ asset_id: e.target.value })}><option value="">Select uploaded sample</option>{assets.filter(a => a.type.toUpperCase() === content.header.type).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
            <TemplateMediaPreview templateId={id} asset={selectedAsset} />
            <Button variant="outline" disabled={busy} onClick={() => setHeader({ asset_id: null })}>Remove from draft</Button>
            <p className="text-xs text-gray-500">JPEG/PNG: 5 MB; MP4 H.264/AAC: 16 MB; PDF: 100 MB. Sending media is selected separately in Bulk Sender.</p>
          </div>}
          <label className="block text-sm">Body (1024 characters)<textarea className={control} rows={6} value={content.body} onChange={e => setContent({ body: e.target.value })} placeholder="Hi {{name}}, welcome to our store." /></label>
          <label className="block text-sm">Footer (60 characters, no variables)<input className={control} value={content.footer} onChange={e => setContent({ footer: e.target.value })} /></label>
          <div className="space-y-3"><h3 className="font-medium">Variables</h3><p className="text-xs text-gray-500">Examples are sent for approval. Recipient fields provide actual values when sending.</p>
            {sections.flatMap(([scope, text]) => tokenKeys(text).map(key => <div key={`${scope}.${key}`} className="space-y-2 rounded-lg border p-3">
              <p className="text-sm">{scope} · {`{{${key}}}`}</p><select className={control} value={content.mappings?.[scope]?.[key] || ''} onChange={e => setContent({ mappings: { ...content.mappings, [scope]: { ...content.mappings?.[scope], [key]: e.target.value } } })}><option value="">Choose recipient field</option>{fields.map(f => <option key={f} value={`customer.${f}`}>customer.{f}</option>)}</select>
              <input className={control} placeholder="Submission example" value={content.examples?.[scope]?.[key] || ''} onChange={e => setContent({ examples: { ...content.examples, [scope]: { ...content.examples?.[scope], [key]: e.target.value } } })} />
            </div>))}
          </div>
          <div className="space-y-3"><h3 className="font-medium">Buttons</h3>{content.buttons.map((b, i) => <div key={i} className="space-y-2 rounded-lg border p-3">
            <select className={control} value={b.type} onChange={e => buttonChange(i, { type: e.target.value })}><option value="QUICK_REPLY">Quick Reply</option><option value="URL">Website URL</option><option value="PHONE_NUMBER">Call Now</option></select>
            <input className={control} placeholder="Label (up to 25 characters)" value={b.text} onChange={e => buttonChange(i, { text: e.target.value })} />
            {b.type === 'URL' && <input className={control} placeholder="https://example.com/order/{{name}}" value={b.url || ''} onChange={e => buttonChange(i, { url: e.target.value })} />}
            {b.type === 'PHONE_NUMBER' && <input className={control} placeholder="+919876543210" value={b.phone_number || ''} onChange={e => buttonChange(i, { phone_number: e.target.value })} />}
            <Button variant="outline" onClick={() => setContent({ buttons: content.buttons.filter((_, j) => i !== j) })}>Remove</Button>
          </div>)}<Button variant="outline" disabled={content.buttons.length >= 10} onClick={() => setContent({ buttons: [...content.buttons, { type: 'QUICK_REPLY', text: '' }] })}>Add Button</Button></div>
          <p className="text-xs text-gray-500">Location, carousel, authentication, flows and commerce templates are unsupported.</p>
        </div>
        <aside className="space-y-3"><h3 className="font-medium">WhatsApp Preview · submission examples</h3><div className="rounded-xl bg-[#e5ddd5] p-4"><div className="space-y-3 rounded-lg bg-white p-4 shadow">
          <TemplateMediaPreview templateId={id} asset={selectedAsset} /><strong>{content.header?.type === 'TEXT' && exampleText(content.header.text, 'header')}</strong>
          <p className="whitespace-pre-wrap text-sm">{exampleText(content.body, 'body')}</p><p className="text-xs text-gray-500">{content.footer}</p>
          {content.buttons.map((b, i) => <div key={i} className="border-t p-2 text-center text-sm text-blue-600">{b.text || 'Button'}</div>)}
        </div></div></aside>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {submissionPending && <p className="w-full text-sm text-amber-700">A submission is awaiting confirmation. Save draft edits, then refresh its status from the list.</p>}
        <Button variant="outline" disabled={busy} onClick={() => run(async () => { await persist(); toast.success('Draft saved'); })}>Save Draft</Button>
        <Button disabled={busy || submissionPending} isLoading={busy} onClick={() => run(async () => { const templateId = await persist(); await templatesApi.submit(templateId); toast.success('Submitted to Meta'); setOpen(false); })}>Submit for Approval</Button>
      </div>
    </Modal>
  </div>;
}
