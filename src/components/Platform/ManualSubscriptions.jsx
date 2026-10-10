import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../UI/button';
import Input from '../UI/input';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/card';
import { platformApi } from '../../services/saas';
import { createManualSubscriptionClient } from '../../services/manualSubscriptions';
import { formatApiError } from '../../services/api';

export default function ManualSubscriptions({ permissions }) {
  const client = useQueryClient();
  const canRead = permissions.includes('subscriptions.read');
  const canManage = permissions.includes('subscriptions.manage');
  const organizations = useQuery({ queryKey: ['platform-organizations'], queryFn: platformApi.organizations, enabled: canRead });
  const subscriptions = useQuery({ queryKey: ['platform-subscriptions'], queryFn: platformApi.subscriptions, enabled: canRead });
  const plans = useQuery({ queryKey: ['platform-subscription-plans'], queryFn: platformApi.subscriptionPlans, enabled: canRead });
  const [submitOperation] = useState(() => createManualSubscriptionClient(platformApi.manageSubscription));
  const [form, setForm] = useState({ organization: '', operation: 'assign', plan_id: '', current_start: '', current_end: '', days: 30, at_period_end: true, reason: '' });
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const organization = organizations.data?.data?.find((row) => String(row.id) === form.organization);
  const current = subscriptions.data?.data?.find((row) => row.organization_id === organization?.id);
  if (!canRead) return canManage ? <p>Subscription controls require subscriptions.read as well as subscriptions.manage.</p> : null;
  const submit = async (event) => {
    event.preventDefault();
    if (!organization || !canManage || busy) return;
    setBusy(true);
    try {
      const values = { reason: form.reason };
      if (form.operation === 'assign') Object.assign(values, { plan_id: form.plan_id, current_start: new Date(form.current_start).toISOString(), current_end: new Date(form.current_end).toISOString() });
      if (form.operation === 'renew') values.days = Number(form.days);
      if (form.operation === 'cancel') values.at_period_end = form.at_period_end;
      await submitOperation(organization.tenant_id, organization.id, form.operation, values);
      await Promise.all(['platform-subscriptions', 'platform-overview', 'platform-audit', 'saas-subscription'].map((key) => client.invalidateQueries({ queryKey: [key] })));
      toast.success('Subscription updated');
    } catch (error) { toast.error(formatApiError(error)); }
    finally { setBusy(false); }
  };
  return <Card><CardHeader><CardTitle>Manual subscriptions</CardTitle></CardHeader><CardContent>
    {[organizations, subscriptions, plans].some((query) => query.isError) && <p role="alert">Subscription details could not be loaded.</p>}
    <form className="space-y-4" onSubmit={submit}>
      <label className="block">Business organization<select required className="ml-3 rounded border p-2" value={form.organization} onChange={(event) => set('organization', event.target.value)}><option value="">Select a business</option>{(organizations.data?.data || []).map((row) => <option key={row.id} value={row.id}>{row.name} (tenant {row.tenant_id}, organization {row.id})</option>)}</select></label>
      {organization && <p>{current ? `Plan: ${current.plan_id} · Status: ${current.effective_status} · Expires: ${current.current_end ? new Date(current.current_end).toLocaleString('en-IN') : 'Unset'}` : 'No subscription assigned.'}{current?.cancel_at_period_end && ' Cancellation is scheduled at expiry.'}</p>}
      {canManage && <>
        <label className="block">Action<select className="ml-3 rounded border p-2" value={form.operation} onChange={(event) => set('operation', event.target.value)}><option value="assign">Assign or replace plan</option><option value="renew">Renew current plan</option><option value="cancel">Cancel subscription</option></select></label>
        {form.operation === 'assign' && <>
          <label className="block">Plan<select required className="ml-3 rounded border p-2" value={form.plan_id} onChange={(event) => set('plan_id', event.target.value)}><option value="">Select a plan</option>{(plans.data?.data || []).filter((row) => row.is_active).map((row) => <option key={row.id} value={row.id}>{row.name} ({row.id})</option>)}</select></label>
          <Input label="Starts" aria-label="Subscription start" type="datetime-local" required value={form.current_start} onChange={(event) => set('current_start', event.target.value)} />
          <Input label="Expires" aria-label="Subscription expiry" type="datetime-local" required value={form.current_end} onChange={(event) => set('current_end', event.target.value)} />
          <p className="text-sm text-gray-600">Dates use your local timezone. Assignment replaces the current plan and period, and clears scheduled cancellation.</p>
        </>}
        {form.operation === 'renew' && <><Input label="Additional days" aria-label="Additional days" type="number" min="1" max="3660" required value={form.days} onChange={(event) => set('days', event.target.value)} /><p className="text-sm">Renewal extends from the later of current expiry or now and clears scheduled cancellation.</p></>}
        {form.operation === 'cancel' && <label className="block">Cancellation timing<select className="ml-3 rounded border p-2" value={String(form.at_period_end)} onChange={(event) => set('at_period_end', event.target.value === 'true')}><option value="true">At expiry (retain current access)</option><option value="false">Immediately (revoke access)</option></select></label>}
        <Input label="Reason" aria-label="Reason for subscription change" required maxLength="500" value={form.reason} onChange={(event) => set('reason', event.target.value)} />
        <p className="text-sm">Changes are audited. Assignment and renewal do not record a payment or create an invoice.</p>
        <Button type="submit" disabled={busy || !organization || [organizations, subscriptions, plans].some((query) => query.isError || query.isLoading)}>{busy ? 'Saving…' : 'Apply subscription change'}</Button>
      </>}
    </form>
  </CardContent></Card>;
}
