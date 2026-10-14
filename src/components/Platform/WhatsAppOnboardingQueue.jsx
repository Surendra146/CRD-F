import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../UI/button';
import Input from '../UI/input';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../UI/dialog';
import WhatsAppOnboardingProgress from '../whatsapp/WhatsAppOnboardingProgress';
import { platformApi } from '../../services/saas';
import { statusLabel, filterRequests, subscriptionDialog } from '../../services/onboarding';
import { formatApiError } from '../../services/api';

export default function WhatsAppOnboardingQueue({ onViewSubscription }) {
  const client = useQueryClient();
  const requests = useQuery({ queryKey: ['platform-onboarding'], queryFn: platformApi.onboarding, refetchInterval: 30000 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [subscription, setSubscription] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');
  const [requiredAction, setRequiredAction] = useState('meta_authorization');
  const [test, setTest] = useState({ test_phone: '', template_name: '', language: 'en_US' });
  const [busy, setBusy] = useState(false);
  const rows = filterRequests(requests.data?.data || [], search, status, subscription);
  const lastPage = Math.max(0, Math.ceil(rows.length / 10) - 1);
  const currentPage = Math.min(page, lastPage);
  const detail = requests.data?.data?.find((row) => row.id === selected);
  const act = async (row, nextStatus, values = {}) => {
    if (busy) return;
    setBusy(true);
    try {
      if (nextStatus === 'verify') await platformApi.verifyOnboarding(row.id, values);
      else await platformApi.updateOnboarding(row.id, { status: nextStatus, ...values });
      await Promise.all(['platform-onboarding', 'platform-overview', 'platform-audit'].map((key) => client.invalidateQueries({ queryKey: [key] })));
      if (nextStatus === 'accepted') setDialog({ title: 'Request Accepted', message: 'WhatsApp onboarding request accepted successfully. You can now start the setup process.', success: true });
      else { setDialog(null); toast.success(nextStatus === 'verify' ? 'Meta accepted the test. Wait for webhook delivery before marking Connected.' : 'Request updated'); }
    } catch (error) {
      const subscriptionError = subscriptionDialog(error);
      if (subscriptionError) setDialog({ ...subscriptionError, row, subscription: true });
      else toast.error(formatApiError(error));
    } finally { setBusy(false); }
  };
  const viewSubscription = (row) => { setDialog(null); onViewSubscription(row.organization_id); };
  const actionDialog = (row, action) => { setMessage(''); setDialog({ row, action, title: action === 'rejected' ? 'Reject Request' : 'Request Tenant Action', message: action === 'rejected' ? 'Enter a reason. The tenant will see this rejection reason.' : 'Provide instructions for the tenant and select the required action.' }); };
  return <Card><CardHeader><CardTitle>WhatsApp Onboarding Queue</CardTitle></CardHeader><CardContent className="space-y-4">
    <div className="grid gap-3 md:grid-cols-3">
      <Input label="Search tenant or business" aria-label="Search tenant or business" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
      <label className="text-sm">Onboarding status<select className="mt-2 block w-full rounded border p-2" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option value="">All statuses</option>{['requested', 'accepted', 'setup_in_progress', 'action_required', 'connected', 'rejected', 'failed', 'cancelled'].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
      <label className="text-sm">Subscription status<select className="mt-2 block w-full rounded border p-2" value={subscription} onChange={(event) => { setSubscription(event.target.value); setPage(0); }}><option value="">All subscriptions</option>{['none', 'active', 'expired', 'cancelled', 'scheduled'].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
    </div>
    {requests.isPending && <p role="status">Loading onboarding queue…</p>}
    {requests.isError && <p role="alert">{formatApiError(requests.error)} <Button variant="outline" onClick={() => requests.refetch()}>Retry</Button></p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Tenant', 'Organization ID', 'Business', 'WhatsApp number', 'Requested', 'Subscription', 'Onboarding', 'Assigned administrator', 'Actions'].map((label) => <th className="whitespace-nowrap border-b p-3" key={label}>{label}</th>)}</tr></thead><tbody>
      {rows.slice(currentPage * 10, currentPage * 10 + 10).map((row) => <tr key={row.id}>
        <td className="p-3">{row.tenant_name || row.tenant_id}</td><td className="p-3">{row.organization_id}</td><td className="p-3">{row.business_name}</td><td className="whitespace-nowrap p-3">+{row.phone}</td><td className="p-3">{new Date(row.created_at).toLocaleDateString('en-IN')}</td><td className="p-3">{statusLabel(row.subscription_status)}</td><td className="p-3">{statusLabel(row.status)}</td><td className="p-3">{row.assigned_admin_id || 'Unassigned'}</td>
        <td className="space-y-2 p-3"><Button variant="outline" onClick={() => { setSelected(row.id); setMessage(''); }}>Details</Button><Button variant="outline" onClick={() => viewSubscription(row)}>View Subscription</Button>{row.status === 'requested' && <><Button disabled={busy} onClick={() => act(row, 'accepted')}>Accept Request</Button><Button variant="outline" disabled={busy} onClick={() => actionDialog(row, 'rejected')}>Reject Request</Button></>}</td>
      </tr>)}
    </tbody></table></div>
    {!requests.isPending && !requests.isError && rows.length === 0 && <p>No matching requests.</p>}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage + 1} of {lastPage + 1} · {rows.length} requests</span><Button variant="outline" disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
    {detail && <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
      <div className="flex justify-between"><h3 className="font-semibold">{detail.business_name} · Organization {detail.organization_id}</h3><Button variant="outline" onClick={() => setSelected(null)}>Close details</Button></div>
      <p>Requested +{detail.phone} · Subscription: {statusLabel(detail.subscription_status)} · Administrator: {detail.assigned_admin_id || 'Unassigned'}</p>
      {detail.eligibility_error && <p role="alert" className="text-amber-800">{detail.eligibility_error[1]}</p>}
      <WhatsAppOnboardingProgress request={detail} />
      {detail.customer_message && <p className="whitespace-pre-wrap">Instructions: {detail.customer_message}</p>}
      {detail.tenant_confirmed_at && <p className="text-green-700">Tenant confirmed completion {new Date(detail.tenant_confirmed_at).toLocaleString('en-IN')}. Review before resuming.</p>}
      <div className="flex flex-wrap gap-3">
        {['accepted', 'action_required'].includes(detail.status) && <Button disabled={busy} onClick={() => act(detail, 'setup_in_progress')}>{detail.status === 'action_required' ? 'Resume Setup' : 'Start Setup'}</Button>}
        {detail.status === 'setup_in_progress' && <Button variant="outline" disabled={busy} onClick={() => actionDialog(detail, 'action_required')}>Request Tenant Action</Button>}
      </div>
      {detail.status === 'setup_in_progress' && <form className="space-y-3 rounded-xl border bg-white p-4" onSubmit={(event) => { event.preventDefault(); act(detail, 'verify', test); }}>
        <h4 className="font-semibold">Verify Connection</h4><p className="text-sm">Verify tenant authorization, approved number, permissions, webhook configuration, and a test message. This sends one real approved template to the consented test recipient below.</p>
        <Input aria-label="Consented test recipient" label="Consented test recipient (country code and digits)" required pattern="[1-9][0-9]{7,14}" value={test.test_phone} onChange={(event) => setTest({ ...test, test_phone: event.target.value })} />
        <Input aria-label="Approved test template" label="Approved template without parameters" required pattern="[a-z0-9_]+" value={test.template_name} onChange={(event) => setTest({ ...test, template_name: event.target.value })} />
        <Input aria-label="Template language" label="Template language" required value={test.language} onChange={(event) => setTest({ ...test, language: event.target.value })} />
        <Button type="submit" disabled={busy}>Verify & Send Permitted Test</Button>
        <Button type="button" disabled={busy || !detail.verification?.test_message_id} onClick={() => act(detail, 'connected')}>Mark as Connected</Button>
      </form>}
      {detail.verification && Object.keys(detail.verification).length > 0 && <dl className="grid gap-2 text-sm md:grid-cols-2">{Object.entries(detail.verification).map(([key, value]) => <div key={key}><dt className="font-medium">{statusLabel(key)}</dt><dd>{String(value)}</dd></div>)}</dl>}
      <h4 className="font-medium">Setup timeline</h4><ol className="space-y-2 text-sm">{(detail.history || []).map((event, index) => <li key={index}>{new Date(event.at).toLocaleString('en-IN')} · {statusLabel(event.event)} · Actor {event.actor_id || 'Migration'}</li>)}</ol>
    </section>}
    <Dialog open={Boolean(dialog)} onOpenChange={(open) => { if (!open && !busy) setDialog(null); }}><DialogContent className="bg-white"><DialogTitle>{dialog?.title}</DialogTitle><DialogDescription>{dialog?.message}</DialogDescription>
      {dialog?.action && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); act(dialog.row, dialog.action, { customer_message: message.trim(), ...(dialog.action === 'action_required' ? { required_action: requiredAction } : {}) }); }}>
        <label className="block">{dialog.action === 'rejected' ? 'Rejection reason' : 'Administrator instructions'}<textarea className="mt-2 w-full rounded border p-3" required maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
        {dialog.action === 'action_required' && <label>Required action<select className="ml-2 rounded border p-2" value={requiredAction} onChange={(event) => setRequiredAction(event.target.value)}>{['meta_authorization', 'phone_verification', 'business_verification', 'other'].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>}
        <Button type="submit" disabled={busy || !message.trim()}>Confirm</Button>
      </form>}
      {dialog?.subscription && <Button onClick={() => viewSubscription(dialog.row)}>View Subscription</Button>}
      <Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>{dialog?.success ? 'Continue' : 'Close'}</Button>
    </DialogContent></Dialog>
  </CardContent></Card>;
}
