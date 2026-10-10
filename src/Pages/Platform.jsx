import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Header from '../components/Layout/Header';
import Button from '../components/UI/button';
import Input from '../components/UI/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/card';
import { platformApi } from '../services/saas';
import ManualSubscriptions from '../components/Platform/ManualSubscriptions';
import { formatApiError } from '../services/api';

export default function Platform() {
  const client = useQueryClient();
  const access = useQuery({ queryKey: ['platform-access'], queryFn: platformApi.access });
  const permissions = access.data?.data?.permissions || [];
  const overview = useQuery({ queryKey: ['platform-overview'], queryFn: platformApi.overview, enabled: permissions.includes('tenants.read') });
  const tenants = useQuery({ queryKey: ['platform-tenants'], queryFn: platformApi.tenants, enabled: permissions.includes('tenants.read') });
  const requests = useQuery({ queryKey: ['platform-onboarding'], queryFn: platformApi.onboarding, enabled: permissions.includes('onboarding.manage') });
  const events = useQuery({ queryKey: ['platform-audit'], queryFn: platformApi.audit, enabled: permissions.includes('audit.read') });
  const [plan, setPlan] = useState({ id: '', name: '', amount_minor: 12000, currency: 'INR', interval: 'monthly', total_cycles: 12, whatsapp_numbers: 1 });
  const [updates, setUpdates] = useState({});
  const [busy, setBusy] = useState(false);
  const act = async (fn, key) => {
    setBusy(true);
    try { await fn(); await client.invalidateQueries({ queryKey: [key] }); await client.invalidateQueries({ queryKey: ['platform-subscription-plans'] }); await client.invalidateQueries({ queryKey: ['platform-audit'] }); toast.success('Saved'); }
    catch (error) { toast.error(formatApiError(error)); }
    finally { setBusy(false); }
  };
  if (access.isLoading) return <p className="p-8">Checking staff access…</p>;
  if (!access.data?.data?.is_staff) return <p role="alert" className="p-8">This console requires an authorized HanuRam Tech staff account.</p>;
  return <div><Header title="HanuRam platform console" subtitle="Business subscriptions, managed onboarding and audited operations." /><div className="space-y-6 p-6">
    {[overview, tenants, requests, events].some((query) => query.isError) && <p role="alert" className="text-red-700">Some platform details could not be loaded.</p>}
    <ManualSubscriptions permissions={permissions} />
    <div className="grid gap-4 md:grid-cols-3">{Object.entries(overview.data?.data || {}).map(([key, value]) => <Card key={key}><CardContent className="p-5"><p className="text-sm text-gray-600">{key.replaceAll('_', ' ')}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
    {permissions.includes('tenants.read') && <Card><CardHeader><CardTitle>Businesses</CardTitle></CardHeader><CardContent>{(tenants.data?.data || []).map((tenant) => <div key={tenant.id} className="flex items-center justify-between border-t py-3"><span>{tenant.name} · {tenant.is_active ? 'Active' : 'Suspended'}</span>{permissions.includes('tenants.manage') && <Button disabled={busy} variant="outline" onClick={() => act(() => platformApi.setTenant(tenant.id, !tenant.is_active), 'platform-tenants')}>{tenant.is_active ? 'Suspend' : 'Reactivate'}</Button>}</div>)}</CardContent></Card>}
    {permissions.includes('plans.manage') && <Card><CardHeader><CardTitle>Create a subscription plan version</CardTitle></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); act(() => platformApi.createPlan(plan), 'saas-plans'); }}>
      {['id', 'name', 'currency'].map((key) => <Input key={key} required label={key.replaceAll('_', ' ')} value={plan[key]} onChange={(event) => setPlan({ ...plan, [key]: event.target.value })} />)}
      {['amount_minor', 'total_cycles', 'whatsapp_numbers'].map((key) => <Input key={key} type="number" min="1" required label={key.replaceAll('_', ' ')} value={plan[key]} onChange={(event) => setPlan({ ...plan, [key]: Number(event.target.value) })} />)}
      <label className="text-sm">Interval<select className="ml-3 rounded border p-2" value={plan.interval} onChange={(event) => setPlan({ ...plan, interval: event.target.value })}>{['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <p className="text-sm text-gray-600">Enter the price in minor units (12000 = INR 120). Existing plan versions remain unchanged.</p><Button disabled={busy} type="submit">Create plan version</Button>
    </form></CardContent></Card>}
    {permissions.includes('onboarding.manage') && <Card><CardHeader><CardTitle>Onboarding queue</CardTitle></CardHeader><CardContent>{(requests.data?.data || []).map((request) => {
      const update = updates[request.id] || { status: 'needs_customer_action', customer_message: '', provider_reference: '' };
      return <form className="mb-6 space-y-3 rounded border p-4" key={request.id} onSubmit={(event) => { event.preventDefault(); act(() => platformApi.updateOnboarding(request.id, update), 'platform-onboarding'); }}>
        <p className="font-semibold">{request.business_name} · {request.phone} · {request.status.replaceAll('_', ' ')}</p>
        <label className="block text-sm">Next status<select className="ml-3 rounded border p-2" value={update.status} onChange={(event) => setUpdates({ ...updates, [request.id]: { ...update, status: event.target.value } })}>{['needs_customer_action', 'provider_review', 'billing_pending', 'ready', 'rejected'].map((state) => <option key={state} value={state}>{state.replaceAll('_', ' ')}</option>)}</select></label>
        <Input label="Message to the customer" required value={update.customer_message} onChange={(event) => setUpdates({ ...updates, [request.id]: { ...update, customer_message: event.target.value } })} />
        <Input label="Verified provider reference" value={update.provider_reference} onChange={(event) => setUpdates({ ...updates, [request.id]: { ...update, provider_reference: event.target.value } })} />
        <Button disabled={busy} type="submit">Update request</Button>
      </form>;
    })}</CardContent></Card>}
    {permissions.includes('audit.read') && <Card><CardHeader><CardTitle>Audit history</CardTitle></CardHeader><CardContent>{(events.data?.data || []).map((row) => <p key={row.id} className="border-t py-3 text-sm">{new Date(row.occurred_at).toLocaleString('en-IN')} · {row.action} · {row.resource_id}</p>)}</CardContent></Card>}
  </div></div>;
}
