import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Button from '../UI/button';
import Input from '../UI/input';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/card';
import WhatsAppConnectionCard from './WhatsAppConnectionCard';
import WhatsAppOnboardingProgress from './WhatsAppOnboardingProgress';
import { saasApi } from '../../services/saas';
import { formatApiError } from '../../services/api';
import { activeStatuses, internationalPhone, statusLabel } from '../../services/onboarding';

export default function WhatsAppSetupAssistance() {
  const client = useQueryClient();
  const requests = useQuery({ queryKey: ['business-onboarding'], queryFn: saasApi.onboarding, refetchInterval: 30000 });
  const subscription = useQuery({ queryKey: ['saas-subscription'], queryFn: saasApi.subscription });
  const [form, setForm] = useState({ business_name: '', country_code: '+91', phone: '' });
  const [busy, setBusy] = useState(false);
  const rows = requests.data?.data || [];
  const active = rows.find((row) => activeStatuses.has(row.status));
  const act = async (fn, message) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await client.invalidateQueries({ queryKey: ['business-onboarding'] });
      toast.success(message);
    } catch (error) { toast.error(error.response ? formatApiError(error) : error.message); }
    finally { setBusy(false); }
  };
  return <Card><CardHeader><CardTitle>WhatsApp Business setup assistance</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-slate-600">Our administrators manage setup. You may need to authorize your Meta Business account or verify your number when our team requests it.</p>
    {requests.isPending && <p role="status">Loading setup requests…</p>}
    {requests.isError && <p role="alert" className="text-red-700">{formatApiError(requests.error)} <Button variant="outline" onClick={() => requests.refetch()}>Retry</Button></p>}
    {!active && <form className="grid gap-4 md:grid-cols-3" onSubmit={(event) => {
      event.preventDefault();
      act(() => saasApi.requestOnboarding({ business_name: form.business_name.trim(), phone: internationalPhone(form.country_code, form.phone) }),
        'Your WhatsApp Business setup request has been submitted successfully. Our team will review your request and contact you with the next steps.');
    }}>
      <Input aria-label="Business name" label="Business name" required maxLength={255} value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} />
      <Input aria-label="Country calling code" label="Country code" required type="tel" value={form.country_code} onChange={(event) => setForm({ ...form, country_code: event.target.value })} />
      <Input aria-label="WhatsApp phone number" label="WhatsApp national phone number" required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      <Button type="submit" disabled={busy || requests.isPending || requests.isError}>{busy ? 'Submitting…' : 'Request Setup Assistance'}</Button>
    </form>}
    {rows.map((row) => <section key={row.id} className="rounded-xl border border-slate-200 p-4">
      <p className="font-semibold">{row.business_name} · +{row.phone} · {statusLabel(row.status)}</p>
      <p className="text-xs text-slate-500">Requested {new Date(row.created_at).toLocaleString('en-IN')}</p>
      <WhatsAppOnboardingProgress request={row} />
      {row.customer_message && <p className="whitespace-pre-wrap text-sm">{row.customer_message}</p>}
      {row.rejection_reason && <p role="alert" className="mt-2 text-red-700">Rejection reason: {row.rejection_reason}</p>}
      {row.status === 'action_required' && <div className="mt-4 space-y-3 rounded-xl bg-amber-50 p-4">
        <h3 className="font-semibold text-red-700">Action Required</h3>
        <p>Your WhatsApp Business setup requires additional verification. Please follow the instructions above.</p>
        <p>Required action: {statusLabel(row.required_action)}</p>
        <p className="text-sm">Instructions sent {new Date(row.action_requested_at).toLocaleString('en-IN')}</p>
        {row.required_action === 'meta_authorization' && <WhatsAppConnectionCard allowAuthorization />}
        <Button disabled={busy || Boolean(row.tenant_confirmed_at)} onClick={() => act(() => saasApi.confirmOnboarding(row.id), 'Your confirmation has been recorded. Our team will review it.')}>{row.tenant_confirmed_at ? 'Confirmation recorded — awaiting administrator review' : 'I Have Completed Verification'}</Button>
      </div>}
      {row.status === 'connected' && <div className="mt-4 space-y-2 rounded-xl bg-green-50 p-4 text-green-800">
        <h3 className="font-semibold">WhatsApp Business — Connected</h3>
        <p>Your WhatsApp Business account is connected successfully. You can now use the WhatsApp features included in your subscription.</p>
        <p>Number: +{row.phone} · WABA: {row.verification?.waba_id} · Phone Number ID: {row.verification?.phone_number_id}</p>
        <p>Connected {new Date(row.connected_at).toLocaleString('en-IN')}</p>
        <p>Messaging and approved templates remain subject to your plan and permissions.</p>
        {!subscription.data?.data?.whatsapp_eligible && <p className="text-amber-800">Messaging access requires an active eligible <Link to="/billing" className="underline">subscription</Link>.</p>}
      </div>}
    </section>)}
  </CardContent></Card>;
}
