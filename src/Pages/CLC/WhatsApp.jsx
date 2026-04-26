import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Gift,
  Globe,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Send,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Badge from '../../components/UI/badge.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import Loader from '../../components/UI/loader.jsx';
import Select from '../../components/UI/select.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/UI/table.jsx';
import { communicationsApi } from '../../services/communications.js';
import { customersApi } from '../../services/customers';
import {
  formatApiError,
  whatsappGraphVersion,
  whatsappPhoneNumberId,
  whatsappProvider,
  whatsappSendPath,
} from '../../services/api';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/format.js';

const templateOptions = [
  { value: 'offer', label: 'Special Offer' },
  { value: 'rating', label: 'Ask for Rating' },
  { value: 'followup', label: 'Follow-up Message' },
];

const segmentOptions = [
  { value: '', label: 'All Segments' },
  { value: 'champions', label: 'Champions' },
  { value: 'loyal_customers', label: 'Loyal Customers' },
  { value: 'potential_loyalist', label: 'Potential Loyalist' },
  { value: 'new_customers', label: 'New Customers' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'hibernating', label: 'Hibernating' },
  { value: 'lost', label: 'Lost' },
];

function normalizeCustomers(payload) {
  return payload?.data?.data || payload?.data?.items || payload?.data || [];
}

function cleanPhoneNumber(value) {
  return (value || '').replace(/[^\d]/g, '');
}

function buildWhatsAppLink(phone, message) {
  const cleanedPhone = cleanPhoneNumber(phone);
  if (!cleanedPhone) return null;
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

function buildTemplateMessage(type, customer) {
  const name = customer?.name || 'there';
  const offerValue = formatCurrency(customer?.lifecycle?.avgOrderValue || 500);

  if (type === 'rating') {
    return `Hi ${name}, thanks for shopping with us. We'd love your feedback. Please reply with a quick rating from 1 to 5 and share any suggestions.`;
  }

  if (type === 'followup') {
    return `Hi ${name}, we noticed it has been a while since your last purchase. If you need help choosing the right product, just reply here and we'll assist you.`;
  }

  return `Hi ${name}, we have a special offer for you today. Based on your recent shopping profile, you may enjoy an exclusive deal around ${offerValue}. Reply to this message to claim it.`;
}

function buildTemplateParameters(type, customer) {
  const customerName = customer?.name || 'Customer';
  const offerValue = formatCurrency(customer?.lifecycle?.avgOrderValue || 500);

  if (type === 'offer') {
    return [customerName, offerValue];
  }

  if (type === 'rating') {
    return [customerName];
  }

  if (type === 'followup') {
    return [customerName];
  }

  return [customerName];
}

export default function WhatsApp() {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [templateType, setTemplateType] = useState('offer');
  const [message, setMessage] = useState('');
  const [lastDelivery, setLastDelivery] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['whatsapp-customers'],
    queryFn: () =>
      customersApi
        .getAll({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
        .then(normalizeCustomers),
  });

  const customers = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const reachableCustomers = useMemo(
    () =>
      customers.filter((customer) => cleanPhoneNumber(customer.whatsappNumber || customer.phone)),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    if (!selectedSegment) return reachableCustomers;
    return reachableCustomers.filter(
      (customer) => customer.lifecycle?.segment === selectedSegment
    );
  }, [reachableCustomers, selectedSegment]);

  const selectedCustomer = useMemo(
    () => reachableCustomers.find((customer) => customer._id === selectedCustomerId) || null,
    [reachableCustomers, selectedCustomerId]
  );

  const customerOptions = filteredCustomers.map((customer) => ({
    value: customer._id,
    label: `${customer.name} - ${customer.whatsappNumber || customer.phone}`,
  }));

  const sendWhatsAppMutation = useMutation({
    mutationFn: ({ customer, outgoingMessage }) =>
      communicationsApi.sendWhatsApp({
        customerId: customer._id,
        name: customer.name,
        phone: cleanPhoneNumber(customer.whatsappNumber || customer.phone),
        provider: whatsappProvider,
        graphVersion: whatsappGraphVersion,
        phoneNumberId: whatsappPhoneNumberId || undefined,
        templateType,
        templateParameters: buildTemplateParameters(templateType, customer),
        preferredLanguage: customer.preferences?.language || 'en',
        channel: 'whatsapp',
        message: outgoingMessage,
      }),
    onSuccess: (response, variables) => {
      const providerMessage =
        response?.data?.message ||
        response?.data?.data?.message ||
        'WhatsApp message sent successfully';

      setLastDelivery({
        customerName: variables.customer.name,
        phone: cleanPhoneNumber(variables.customer.whatsappNumber || variables.customer.phone),
        mode: 'api',
        message: variables.outgoingMessage,
        deliveryMode: response?.data?.data?.deliveryMode || 'text',
      });
      toast.success(providerMessage);
    },
    onError: (error, variables) => {
      toast.error(formatApiError(error));
      if (variables?.allowFallback) {
        const fallbackLink = buildWhatsAppLink(
          variables.customer.whatsappNumber || variables.customer.phone,
          variables.outgoingMessage
        );
        if (fallbackLink) {
          window.open(fallbackLink, '_blank', 'noopener,noreferrer');
        }
      }
    },
  });

  const applyTemplate = () => {
    const nextMessage = buildTemplateMessage(templateType, selectedCustomer);
    setMessage(nextMessage);
    toast.success('Message template applied');
  };

  const resolveOutgoingMessage = (customer) =>
    message.trim() || buildTemplateMessage(templateType, customer);

  const handleOpenWhatsApp = (customer = selectedCustomer) => {
    if (!customer) {
      toast.error('Please choose a customer first');
      return;
    }

    const customerPhone = customer.whatsappNumber || customer.phone;
    if (!cleanPhoneNumber(customerPhone)) {
      toast.error('This customer does not have a valid phone number');
      return;
    }

    const outgoingMessage = resolveOutgoingMessage(customer);
    const link = buildWhatsAppLink(customerPhone, outgoingMessage);

    if (!link) {
      toast.error('Unable to create WhatsApp link');
      return;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
    setLastDelivery({
      customerName: customer.name,
      phone: cleanPhoneNumber(customerPhone),
      mode: 'manual',
      message: outgoingMessage,
    });
  };

  const handleSendViaApi = (customer = selectedCustomer) => {
    if (!customer) {
      toast.error('Please choose a customer first');
      return;
    }

    const customerPhone = customer.whatsappNumber || customer.phone;
    if (!cleanPhoneNumber(customerPhone)) {
      toast.error('This customer does not have a valid phone number');
      return;
    }

    const outgoingMessage = resolveOutgoingMessage(customer);

    sendWhatsAppMutation.mutate({
      customer,
      outgoingMessage,
      allowFallback: true,
    });
  };

  const quickTemplates = [
    {
      key: 'offer',
      label: 'Offer Blast',
      icon: Gift,
      description: 'Promote discounts and limited-time deals',
    },
    {
      key: 'rating',
      label: 'Rating Request',
      icon: Star,
      description: 'Ask customers for a product or service rating',
    },
    {
      key: 'followup',
      label: 'Re-engagement',
      icon: MessageSquareQuote,
      description: 'Reconnect with customers who have gone quiet',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="WhatsApp Communication"
        subtitle="Talk to customers through WhatsApp for offers, follow-ups, and rating requests"
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            Refresh Customers
          </Button>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Reachable Customers</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(reachableCustomers.length)}
                </p>
              </div>
              <Users className="h-6 w-6 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Selected Template</p>
                <p className="mt-2 text-2xl font-semibold capitalize text-gray-900">
                  {templateType}
                </p>
              </div>
              <Sparkles className="h-6 w-6 text-primary-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Delivery Mode</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {whatsappProvider === 'meta_cloud' ? 'Meta Cloud' : 'Manual Link'}
                  </p>
              </div>
              <MessageCircle className="h-6 w-6 text-gray-700" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Message Composer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isError ? (
                <p className="text-sm text-red-500">
                  Customers could not be loaded. Please refresh and try again.
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select
                  label="Segment"
                  options={segmentOptions}
                  value={selectedSegment}
                  onChange={(e) => {
                    setSelectedSegment(e.target.value);
                    setSelectedCustomerId('');
                  }}
                />
                <Select
                  label="Template"
                  options={templateOptions}
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                />
                <Select
                  label="Customer"
                  options={customerOptions}
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const nextCustomerId = e.target.value;
                    setSelectedCustomerId(nextCustomerId);
                    const nextCustomer =
                      filteredCustomers.find((customer) => customer._id === nextCustomerId) || null;
                    setMessage(buildTemplateMessage(templateType, nextCustomer));
                  }}
                  placeholder="Choose customer"
                />
              </div>

              {selectedCustomer ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <Badge variant="info">
                      {(selectedCustomer.lifecycle?.segment || 'unassigned').replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {selectedCustomer.whatsappNumber || selectedCustomer.phone}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Last purchase:{' '}
                    {selectedCustomer.lifecycle?.lastPurchaseDate
                      ? formatRelativeTime(selectedCustomer.lifecycle.lastPurchaseDate)
                      : 'No purchase yet'}
                  </p>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="whatsapp-message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="whatsapp-message"
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your WhatsApp message here..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={applyTemplate}>
                  Apply Template
                </Button>
                <Button
                  onClick={() => handleSendViaApi()}
                  isLoading={sendWhatsAppMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send via API
                </Button>
                <Button onClick={() => handleOpenWhatsApp()}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Open WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2">
                    <Globe className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">API endpoint</p>
                    <p className="mt-1 break-all text-sm text-gray-500">{whatsappSendPath}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">Meta Cloud target</p>
                <p className="mt-2 text-sm text-gray-500">
                  Provider: {whatsappProvider}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Graph version: {whatsappGraphVersion}
                </p>
                <p className="mt-1 break-all text-sm text-gray-500">
                  Phone number ID: {whatsappPhoneNumberId || 'Not configured'}
                </p>
              </div>

              {lastDelivery ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-800">Last delivery</p>
                  <p className="mt-2 text-sm text-green-700">
                    {lastDelivery.customerName} ({lastDelivery.phone})
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Sent via {lastDelivery.mode === 'api' ? 'backend API' : 'manual WhatsApp link'}
                  </p>
                  {lastDelivery.deliveryMode ? (
                    <p className="mt-1 text-sm text-green-700">
                      Meta delivery mode: {lastDelivery.deliveryMode}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">Quick Use Cases</p>
                {quickTemplates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    className="w-full rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
                    onClick={() => {
                      setTemplateType(template.key);
                      setMessage(buildTemplateMessage(template.key, selectedCustomer));
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-100 p-2">
                        <template.icon className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{template.label}</p>
                        <p className="text-sm text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Ready Customers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCustomers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.slice(0, 12).map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email || 'No email'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {customer.whatsappNumber || customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {(customer.lifecycle?.segment || 'unassigned').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(customer.lifecycle?.totalSpent || 0)}
                      </TableCell>
                      <TableCell>
                        {customer.lifecycle?.lastPurchaseDate
                          ? formatRelativeTime(customer.lifecycle.lastPurchaseDate)
                          : 'No recent purchase'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomerId(customer._id);
                            setMessage(buildTemplateMessage(templateType, customer));
                            handleSendViaApi(customer);
                          }}
                        >
                          Send
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No customers with WhatsApp-ready phone numbers were found for this filter.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
