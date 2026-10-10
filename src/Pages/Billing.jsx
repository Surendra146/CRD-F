import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '../components/Layout/Header';
import Button from '../components/UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/card';
import { saasApi } from '../services/saas';

const money = (minor, currency) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minor / 100);

export default function Billing() {
  const client = useQueryClient();
  const plans = useQuery({ queryKey: ['saas-plans'], queryFn: saasApi.plans });
  const subscription = useQuery({ queryKey: ['saas-subscription'], queryFn: saasApi.subscription });
  const invoices = useQuery({ queryKey: ['saas-invoices'], queryFn: saasApi.invoices });
  const usage = useQuery({ queryKey: ['saas-usage'], queryFn: saasApi.usage });
  const row = subscription.data?.data;
  const refresh = () => client.invalidateQueries({ queryKey: ['saas-subscription'] });
  return <div><Header title="Subscription & billing" subtitle="Your software subscription and WhatsApp messaging charges are shown separately." />
    <div className="space-y-6 p-6">
      {[plans, subscription, invoices, usage].some((query) => query.isError) && <p role="alert" className="text-red-700">Billing details could not be loaded. Please refresh or contact HanuRam support.</p>}
      <p role="status" className="rounded border p-4">HanuRam Tech staff manage plan assignment, renewal and cancellation. Contact support to request a change.</p>
      <Card><CardHeader><CardTitle>Current subscription</CardTitle></CardHeader><CardContent>
        <p>{subscription.isLoading ? 'Loading…' : row ? `Status: ${(row.effective_status || row.status).replaceAll('_', ' ')}` : 'Contact HanuRam Tech to assign a plan.'}</p>
        {row?.current_start && <p className="mt-2 text-sm">Starts {new Date(row.current_start).toLocaleString('en-IN')}.</p>}
        {row?.current_end && <p className="mt-2 text-sm text-gray-600">Subscription expires {new Date(row.current_end).toLocaleString('en-IN')}.</p>}
        {row?.cancel_at_period_end && <p className="mt-2 text-sm">Cancellation is scheduled for the end of this period.</p>}
        <Button className="mt-4" onClick={refresh} disabled={subscription.isFetching}>Refresh subscription</Button>
      </CardContent></Card>
      <div className="grid gap-4 md:grid-cols-3">{(plans.data?.data || []).map((plan) => <Card key={plan.id}><CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader><CardContent>
        <p className="text-2xl font-semibold">{money(plan.amount_minor, plan.currency)} <span className="text-sm font-normal">/ {plan.interval}</span></p>
        <p className="my-4 text-sm">Up to {plan.entitlements?.whatsapp_numbers || 0} business WhatsApp numbers. Messaging charges are additional.</p>
      </CardContent></Card>)}</div>
      {!plans.isLoading && !(plans.data?.data || []).length && <p>No plans are available yet. Contact HanuRam Tech to set up your subscription.</p>}
      <Card><CardHeader><CardTitle>Subscription invoices</CardTitle></CardHeader><CardContent>
        {(invoices.data?.data || []).length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{invoices.data.data.map((invoice) => <tr key={invoice.id} className="border-t"><td className="p-2">{invoice.invoice_reference || invoice.id}</td><td>{new Date(invoice.created_at).toLocaleDateString('en-IN')}</td><td>{money(invoice.amount_minor, invoice.currency)}</td><td>{invoice.status}</td></tr>)}</tbody></table></div> : <p>No invoices yet.</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>WhatsApp messaging usage</CardTitle></CardHeader><CardContent>
        <p className="mb-4 text-sm text-gray-600">{usage.data?.billing_note}</p>
        {(usage.data?.data || []).map((entry) => <div key={entry.id} className="flex justify-between border-t py-3 text-sm"><span>{entry.period} · {entry.category} · {entry.quantity} messages</span><span>{entry.amount_minor === null ? 'Not billed' : money(entry.amount_minor, entry.currency)}</span></div>)}
        {!(usage.data?.data || []).length && <p>No reconciled messaging charges yet.</p>}
      </CardContent></Card>
    </div></div>;
}
