import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Button from '../components/UI/button';
import Input from '../components/UI/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/card';
import WhatsAppConnectionCard from '../components/whatsapp/WhatsAppConnectionCard';
import { saasApi } from '../services/saas';
import { formatApiError } from '../services/api';

export default function Business() {
  const client = useQueryClient();
  const profile = useQuery({ queryKey: ['business-profile'], queryFn: saasApi.profile });
  const numbers = useQuery({ queryKey: ['business-numbers'], queryFn: saasApi.numbers });
  const requests = useQuery({ queryKey: ['business-onboarding'], queryFn: saasApi.onboarding });
  const consents = useQuery({ queryKey: ['business-consents'], queryFn: saasApi.consents });
  const [form, setForm] = useState(null);
  const [onboarding, setOnboarding] = useState({ phone: '', business_name: '' });
  const [consent, setConsent] = useState({ phone: '', opted_in: false, source: 'customer_request', evidence: '' });
  const [busy, setBusy] = useState(false);
  const value = form || profile.data?.data || { legal_name: '', billing_email: '', phone: '', tax_id: '', address: {} };
  const act = async (fn, key, message) => {
    setBusy(true);
    try { await fn(); await client.invalidateQueries({ queryKey: [key] }); toast.success(message); }
    catch (error) { toast.error(formatApiError(error)); }
    finally { setBusy(false); }
  };
  const field = (key, label) => <Input label={label} value={value[key] || ''} onChange={(event) => setForm({ ...value, [key]: event.target.value })} />;
  return <div><Header title="Business & WhatsApp" subtitle="Set up your business and let HanuRam Tech handle the technical connection." />
    <div className="space-y-6 p-6">
      {[profile, numbers, requests, consents].some((query) => query.isError) && <p role="alert" className="text-red-700">Some business details could not be loaded. Check your access or contact support.</p>}
      <Card><CardHeader><CardTitle>Business profile</CardTitle></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); act(() => saasApi.updateProfile({ legal_name: value.legal_name, billing_email: value.billing_email || null, phone: value.phone || null, tax_id: value.tax_id || null, address: value.address || {}, website: value.website || null }), 'business-profile', 'Business profile saved'); }}>
        {field('legal_name', 'Legal business name')}{field('billing_email', 'Billing email')}{field('phone', 'Business phone')}{field('tax_id', 'GST / tax registration, if applicable')}{field('website', 'Business website')}
        <Input label="Billing address" value={value.address?.line || ''} onChange={(event) => setForm({ ...value, address: { ...value.address, line: event.target.value } })} />
        <Button type="submit" disabled={busy || profile.isLoading}>Save business profile</Button>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>Connect your WhatsApp</CardTitle></CardHeader><CardContent>
        <p className="mb-4 text-sm text-gray-600">Choose a <Link to="/billing" className="text-blue-700 underline">subscription</Link>, then connect your business account below or request help. You will authorize your business and complete any required verification; HanuRam manages the integration.</p>
        <WhatsAppConnectionCard />
        <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); act(() => saasApi.requestOnboarding(onboarding), 'business-onboarding', 'Your onboarding request has been submitted'); }}>
          <Input label="Business name" required value={onboarding.business_name} onChange={(event) => setOnboarding({ ...onboarding, business_name: event.target.value })} />
          <Input label="Your business WhatsApp number" required type="tel" value={onboarding.phone} onChange={(event) => setOnboarding({ ...onboarding, phone: event.target.value })} />
          <Button type="submit" disabled={busy}>Request setup assistance</Button>
        </form>
        {(requests.data?.data || []).map((row) => <div className="mt-4 rounded border p-3 text-sm" key={row.id}><strong>{row.business_name}</strong> · {row.status.replaceAll('_', ' ')}{row.customer_message && <p className="mt-2">{row.customer_message}</p>}</div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Your business numbers</CardTitle></CardHeader><CardContent>
        {(numbers.data?.data || []).map((row) => <div key={row.phone_number_id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3"><span>{row.display_phone_number || row.verified_name || 'Business WhatsApp'} {row.is_default && '· Default'} {row.expired && '· Reconnect required'}</span><div className="flex gap-2">{!row.is_default && <Button variant="outline" disabled={busy} onClick={() => act(() => saasApi.defaultNumber(row.phone_number_id), 'business-numbers', 'Default number updated')}>Set default</Button>}<Button variant="outline" disabled={busy} onClick={() => act(() => saasApi.disconnectNumber(row.phone_number_id), 'business-numbers', 'Number disconnected')}>Disconnect</Button></div></div>)}
        <Button className="mt-4" disabled={busy} onClick={() => act(saasApi.syncTemplates, 'templates', 'WhatsApp templates synchronized')}>Sync approved templates</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Customer messaging permission</CardTitle></CardHeader><CardContent>
        <p className="mb-4 text-sm text-gray-600">Record customer permission with evidence before marketing. Removing permission stops future messages, including queued campaigns.</p>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); act(() => saasApi.setConsent(consent), 'business-consents', 'Customer permission updated'); }}>
          <Input label="Customer phone number" type="tel" required value={consent.phone} onChange={(event) => setConsent({ ...consent, phone: event.target.value })} />
          <Input label="Evidence / customer request reference" value={consent.evidence} onChange={(event) => setConsent({ ...consent, evidence: event.target.value })} required={consent.opted_in} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={consent.opted_in} onChange={(event) => setConsent({ ...consent, opted_in: event.target.checked })} />Customer has explicitly agreed to messaging</label>
          <Button type="submit" disabled={busy}>Record permission</Button>
        </form>
        {(consents.data?.data || []).map((row) => <p key={row.id} className="mt-3 border-t pt-3 text-sm">{row.phone} · {row.opted_in ? 'Opted in' : 'Messaging stopped'}</p>)}
      </CardContent></Card>
    </div></div>;
}
