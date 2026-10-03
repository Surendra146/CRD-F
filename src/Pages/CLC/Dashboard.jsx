import { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Store,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent } from '../../components/UI/card.jsx';
import Loader from '../../components/UI/loader.jsx';
import { analyticsApi } from '../../services/analytics.js';
import { formatCurrency, formatNumber, getSegmentColor } from '../../utils/format.js';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

function ChartFallback() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="flex h-80 items-center justify-center">
          <Loader />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex h-80 items-center justify-center">
          <Loader />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardContent className="flex h-80 items-center justify-center">
          <Loader />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedLocation],
    queryFn: () =>
      analyticsApi
        .getDashboard(selectedLocation === 'all' ? {} : { location: selectedLocation })
        .then((res) => res?.data || res),
  });

  const locations = Array.isArray(data?.locations) ? data.locations : [];
  const locationOptions = ['all', ...locations];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Header
          title="Dashboard"
          subtitle="Overview of your customer lifecycle metrics"
        />
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardContent className="py-12 text-center text-red-500">
              Failed to load dashboard data
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const overview = data.overview ?? {};
  const revenue = data.revenue ?? {};
  const segments = data.segments ?? {};
  const recentActivity = Array.isArray(data.recentActivity) ? data.recentActivity : [];
  const statCards = [
    {
      title: 'Total Customers',
      value: formatNumber(overview.totalCustomers ?? 0),
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Customers',
      value: formatNumber(overview.activeCustomers ?? 0),
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      title: 'At Risk',
      value: formatNumber(overview.atRiskCustomers ?? 0),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Churned',
      value: formatNumber(overview.churnedCustomers ?? 0),
      icon: UserX,
      color: 'bg-red-500',
    },
  ];

  const revenueCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue.totalRevenue ?? 0),
      icon: DollarSign,
      change: '+12.5%',
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(revenue.avgOrderValue ?? 0),
      icon: ShoppingCart,
      change: '+5.2%',
    },
    {
      title: 'Total Orders',
      value: formatNumber(revenue.totalOrders ?? 0),
      icon: Activity,
      change: '+8.1%',
    },
    {
      title: 'Avg Lifetime Value',
      value: formatCurrency(revenue.avgLifetimeValue ?? 0),
      icon: TrendingUp,
      change: '+15.3%',
    },
  ];

  const segmentData = Object.entries(segments).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    value: count,
    color: getSegmentColor(name),
  }));

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of your customer lifecycle metrics"
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
              <span>Location</span>
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="bg-transparent text-sm text-gray-900 outline-none"
              >
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location === 'all' ? 'All Locations' : location}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline">
              <Store className="mr-2 h-4 w-4" />
              POS Type
            </Button>
          </div>
        }
      />

      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="flex items-center p-6">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {revenueCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                    {stat.change}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Suspense fallback={<ChartFallback />}>
          <DashboardCharts
            recentActivity={recentActivity}
            segmentData={segmentData}
          />
        </Suspense>
      </div>
    </div>
  );
}
