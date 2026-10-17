import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { canAccessPlatformPage } from '../utils/platformAccess';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Header from '../components/Layout/Header';
import Button from '../components/UI/button';
import Input from '../components/UI/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/card';
import { platformApi } from '../services/saas';
import ManualSubscriptions from '../components/Platform/ManualSubscriptions';
import WhatsAppOnboardingQueue from '../components/Platform/WhatsAppOnboardingQueue';
import { formatApiError } from '../services/api';

export default function Platform({ page = 'console' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = page === 'onboarding';
  const client = useQueryClient();
  const access = useQuery({ queryKey: ['platform-access'], queryFn: platformApi.access });
  const permissions = access.data?.data?.permissions || [];
  const overview = useQuery({ queryKey: ['platform-overview'], queryFn: platformApi.overview, enabled: !isOnboarding && permissions.includes('tenants.read') });
  const tenants = useQuery({ queryKey: ['platform-tenants'], queryFn: platformApi.tenants, enabled: !isOnboarding && permissions.includes('tenants.read') });
  const events = useQuery({ queryKey: ['platform-audit'], queryFn: platformApi.audit, enabled: !isOnboarding && permissions.includes('audit.read') });
  const [plan, setPlan] = useState({ id: '', name: '', amount_minor: 12000, currency: 'INR', interval: 'monthly', total_cycles: 12, whatsapp_numbers: 1 });
  const subscriptionOrganization = searchParams.get('organization');
  const [busy, setBusy] = useState(false);
  const act = async (fn, key) => {
    setBusy(true);
    try { await fn(); await client.invalidateQueries({ queryKey: [key] }); await client.invalidateQueries({ queryKey: ['platform-subscription-plans'] }); await client.invalidateQueries({ queryKey: ['platform-audit'] }); toast.success('Saved'); }
    catch (error) { toast.error(formatApiError(error)); }
    finally { setBusy(false); }
  };
  if (access.isLoading) return <p className="p-8">Checking staff access…</p>;
  if (!access.data?.data?.is_staff) return <p role="alert" className="p-8">This console requires an authorized HanuRam Tech staff account.</p>;
  if (!canAccessPlatformPage(permissions, page)) return <p role="alert" className="p-8">You do not have permission to access this subscription submodule.</p>;
  if (isOnboarding) return <div><Header title="WhatsApp Onboarding" subtitle="Review requests and manage tenant setup. Acceptance requires an active eligible subscription." /><div className="space-y-6 p-4 sm:p-6"><WhatsAppOnboardingQueue onViewSubscription={permissions.includes('subscriptions.read') ? (organizationId) => navigate(`/platform?organization=${encodeURIComponent(organizationId)}`) : undefined} /></div></div>;
  return <div><Header title="HanuRam platform console" subtitle="Manual business subscriptions and audited platform operations." /><div className="space-y-6 p-4 sm:p-6">
    {[overview, tenants, events].some((query) => query.isError) && <p role="alert" className="text-red-700">Some platform details could not be loaded.</p>}
    <div id="subscription-management"><ManualSubscriptions key={subscriptionOrganization || 'subscriptions'} permissions={permissions} selectedOrganization={subscriptionOrganization} /></div>
    <div className="grid gap-4 md:grid-cols-3">{Object.entries(overview.data?.data || {}).map(([key, value]) => <Card key={key}><CardContent className="p-5"><p className="text-sm text-gray-600">{key.replaceAll('_', ' ')}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
    {permissions.includes('tenants.read') && <Card><CardHeader><CardTitle>Businesses</CardTitle></CardHeader><CardContent>{(tenants.data?.data || []).map((tenant) => <div key={tenant.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3"><span>{tenant.name} · {tenant.is_active ? 'Active' : 'Suspended'}</span>{permissions.includes('tenants.manage') && <Button isLoading={busy} variant={tenant.is_active ? 'danger' : 'secondary'} onClick={() => act(() => platformApi.setTenant(tenant.id, !tenant.is_active), 'platform-tenants')}>{tenant.is_active ? 'Suspend' : 'Reactivate'}</Button>}</div>)}</CardContent></Card>}
    {permissions.includes('plans.manage') && <Card><CardHeader><CardTitle>Create a subscription plan version</CardTitle></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); act(() => platformApi.createPlan(plan), 'saas-plans'); }}>
      {['id', 'name', 'currency'].map((key) => <Input key={key} required label={key.replaceAll('_', ' ')} value={plan[key]} onChange={(event) => setPlan({ ...plan, [key]: event.target.value })} />)}
      {['amount_minor', 'total_cycles', 'whatsapp_numbers'].map((key) => <Input key={key} type="number" min="1" required label={key.replaceAll('_', ' ')} value={plan[key]} onChange={(event) => setPlan({ ...plan, [key]: Number(event.target.value) })} />)}
      <label className="text-sm">Interval<select className="mt-2 block min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={plan.interval} onChange={(event) => setPlan({ ...plan, interval: event.target.value })}>{['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <p className="text-sm text-gray-600">Enter the price in minor units (12000 = INR 120). Existing plan versions remain unchanged.</p><div className="flex flex-wrap justify-end gap-3 md:col-span-2"><Button isLoading={busy} type="submit">Create plan version</Button></div>
    </form></CardContent></Card>}
    {permissions.includes('audit.read') && <Card><CardHeader><CardTitle>Audit history</CardTitle></CardHeader><CardContent>{(events.data?.data || []).map((row) => <p key={row.id} className="border-t py-3 text-sm">{new Date(row.occurred_at).toLocaleString('en-IN')} · {row.action} · {row.resource_id}</p>)}</CardContent></Card>}
  </div></div>;
}
