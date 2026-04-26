import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import Header from '../../components/Layout/Header.jsx';
import Badge from '../../components/UI/badge.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import Loader from '../../components/UI/loader.jsx';
import { customersApi } from '../../services/customers';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
} from '../../utils/format.js';

function safeDate(value, fallback = 'Not available') {
  if (!value) return fallback;
  try {
    return formatDate(value);
  } catch {
    return fallback;
  }
}

function safeRelativeDate(value, fallback = 'No recent activity') {
  if (!value) return fallback;
  try {
    return formatRelativeTime(value);
  } catch {
    return fallback;
  }
}

function statusVariant(status) {
  if (status === 'active') return 'success';
  if (status === 'at_risk') return 'warning';
  if (status === 'churned') return 'danger';
  if (status === 'loyal') return 'info';
  return 'default';
}

function normalizeCustomer(payload) {
  return payload?.data?.data || payload?.data?.customer || payload?.data || payload || null;
}

function normalizeTimeline(payload) {
  return payload?.data?.data || payload?.data?.timeline || payload?.data || payload || [];
}

export default function CustomerDetail() {
  const { id } = useParams();

  const customerQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id).then(normalizeCustomer),
    enabled: Boolean(id),
  });

  const timelineQuery = useQuery({
    queryKey: ['customer-timeline', id],
    queryFn: () => customersApi.getTimeline(id).then(normalizeTimeline),
    enabled: Boolean(id),
  });

  const customer = customerQuery.data;
  const timeline = Array.isArray(timelineQuery.data) ? timelineQuery.data : [];
  const isLoading = customerQuery.isLoading || timelineQuery.isLoading;
  const hasError = customerQuery.isError;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (hasError || !customer) {
    return (
      <div>
        <Header title="Customer Detail" subtitle="View individual customer information" />
        <div className="p-8">
          <Card>
            <CardContent className="space-y-4 py-10 text-center">
              <p className="text-red-500">Unable to load this customer.</p>
              <Link to="/customers">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Customers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const lifecycle = customer.lifecycle || {};
  const demographics = customer.demographics || {};
  const location = demographics.location || {};
  const interactions = customer.interactions || [];

  const stats = [
    {
      label: 'Total Spent',
      value: formatCurrency(lifecycle.totalSpent || 0),
      icon: DollarSign,
    },
    {
      label: 'Orders',
      value: formatNumber(lifecycle.totalPurchases || 0),
      icon: ShoppingBag,
    },
    {
      label: 'Last Purchase',
      value: safeRelativeDate(lifecycle.lastPurchaseDate, 'Never'),
      icon: Calendar,
    },
    {
      label: 'Interactions',
      value: formatNumber(interactions.length),
      icon: MessageSquare,
    },
  ];

  return (
    <div>
      <Header
        title={customer.name || 'Customer Detail'}
        subtitle={`Customer ID: ${id}`}
        actions={
          <Link to="/customers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 p-8">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-gray-900">{customer.name || 'Unnamed customer'}</h2>
                  <Badge variant={statusVariant(lifecycle.status)}>
                    {(lifecycle.status || 'unknown').replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="mt-2 capitalize text-sm text-gray-600">
                  Segment: {(lifecycle.segment || 'unassigned').replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Created {safeDate(customer.createdAt, 'Unknown creation date')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{customer.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{customer.phone || customer.whatsappNumber || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:col-span-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {[location.city, location.state, location.country].filter(Boolean).join(', ') || 'No location on file'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Age</p>
                <p className="mt-1 text-sm text-gray-800">{demographics.age || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Gender</p>
                <p className="mt-1 text-sm text-gray-800">{demographics.gender || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">External ID</p>
                <p className="mt-1 text-sm text-gray-800">{customer.externalId || 'Not linked'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Average Order Value</p>
                <p className="mt-1 text-sm text-gray-800">
                  {formatCurrency(lifecycle.avgOrderValue || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineQuery.isError ? (
                <p className="text-sm text-red-500">Timeline data could not be loaded.</p>
              ) : timeline.length ? (
                <div className="space-y-4">
                  {timeline.slice(0, 12).map((item, index) => (
                    <div key={item._id || item.id || `${item.type || 'event'}-${index}`} className="flex gap-4">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium capitalize text-gray-900">
                            {(item.type || item.event || 'activity').replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {safeDate(item.createdAt || item.date || item.timestamp)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {item.description || item.notes || item.message || 'No additional details provided.'}
                        </p>
                        {item.amount ? (
                          <p className="mt-2 text-sm font-medium text-gray-800">
                            Amount: {formatCurrency(item.amount)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No timeline activity found for this customer yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
