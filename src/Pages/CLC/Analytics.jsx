import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, DollarSign, RefreshCw, TrendingDown } from 'lucide-react';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import Loader from '../../components/UI/loader.jsx';
import { analyticsApi } from '../../services/analytics.js';
import { formatCurrency, formatNumber } from '../../utils/format.js';

/* =========================
   FIXED NORMALIZER
========================= */
function normalizeData(payload) {
  return payload?.data || payload || null;
}

function sumRevenue(entries) {
  return Array.isArray(entries)
    ? entries.reduce((sum, entry) => sum + (entry.revenue || 0), 0)
    : 0;
}

export default function Analytics() {
  /* =========================
     FIXED QUERY CALLS
  ========================= */
  const dashboardQuery = useQuery({
    queryKey: ['analytics-dashboard-summary'],
    queryFn: () => analyticsApi.getDashboard(),
  });

  const segmentsQuery = useQuery({
    queryKey: ['analytics-segments'],
    queryFn: () => analyticsApi.getSegments(),
  });

  const revenueQuery = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: () => analyticsApi.getRevenue(),
  });

  const churnQuery = useQuery({
    queryKey: ['analytics-churn'],
    queryFn: () => analyticsApi.getChurn(),
  });

  const isLoading =
    dashboardQuery.isLoading ||
    segmentsQuery.isLoading ||
    revenueQuery.isLoading ||
    churnQuery.isLoading;

  const hasAnyError =
    dashboardQuery.isError ||
    segmentsQuery.isError ||
    revenueQuery.isError ||
    churnQuery.isError;

  /* =========================
     FIXED DATA ACCESS
  ========================= */
  const dashboard = normalizeData(dashboardQuery.data) || {};
  const segments = normalizeData(segmentsQuery.data) || [];
  const revenue = normalizeData(revenueQuery.data) || {};
  const churn = normalizeData(churnQuery.data) || {};

  const overview = dashboard.overview || {};
  const dashboardRevenue = dashboard.revenue || {};

  const churnedCount = Array.isArray(churn.churnedCustomers)
    ? churn.churnedCustomers.length
    : 0;

  const atRiskCount = Array.isArray(churn.atRiskCustomers)
    ? churn.atRiskCustomers.length
    : 0;

  const totalCustomers = overview.totalCustomers || 0;

  const churnRate = totalCustomers
    ? (churnedCount / totalCustomers) * 100
    : 0;

  const totalRevenue =
    dashboardRevenue.totalRevenue ||
    sumRevenue(revenue.dailyRevenue);

  const summaryCards = [
    {
      title: 'Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: `${formatNumber(dashboardRevenue.totalOrders || 0)} orders`,
      icon: DollarSign,
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(dashboardRevenue.avgOrderValue || 0),
      subtitle: 'Across tracked purchases',
      icon: BarChart3,
    },
    {
      title: 'Churn Rate',
      value: `${Number(churnRate).toFixed(1)}%`,
      subtitle: `${formatNumber(churnedCount)} churned customers`,
      icon: TrendingDown,
    },
    {
      title: 'At Risk',
      value: formatNumber(atRiskCount || overview.atRiskCustomers || 0),
      subtitle: 'Customers needing attention',
      icon: AlertTriangle,
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
        title="Analytics"
        subtitle="Segment health, revenue, and churn trends"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              dashboardQuery.refetch();
              segmentsQuery.refetch();
              revenueQuery.refetch();
              churnQuery.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="flex items-start justify-between p-6">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
                  <card.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Segment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(segments) && segments.length ? (
                <div className="space-y-4">
                  {segments.map((segment) => {
                    const count = segment.count || 0;
                    const percentage = totalCustomers
                      ? Math.round((count / totalCustomers) * 100)
                      : 0;

                    return (
                      <div key={segment._id || 'unknown'}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-700">
                            {(segment._id || 'unassigned').replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-500">
                            {formatNumber(count)} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-primary-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No segment analytics are available yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Total Revenue
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Average Lifetime Value
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrency(dashboardRevenue.avgLifetimeValue || 0)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Churn Summary
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {formatNumber(churnedCount)} customers
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {Number(churnRate).toFixed(1)}% churn rate
                </p>
              </div>

              {hasAnyError && (
                <p className="text-sm text-red-500">
                  Some analytics endpoints are unavailable right now.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}