import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

import Input from '../../components/UI/input';
import Select from '../../components/UI/select';
import { useDashboard } from '../../context/useDashboard';
import { formatApiError } from '../../services/api';
import { customDashboardAnalyticsApi } from '../../services/analytics';
import { formatCurrency } from '../../utils/helper';

const CHART_COLORS = ['#0A0A0A', '#002FA7', '#FF2A2A', '#FFC800', '#4B5563'];

export default function DashboardBuilder() {
  const { id } = useParams();
  const { currentDashboard, fetchDashboard } = useDashboard();

  const [analyticsData, setAnalyticsData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ stores: [], categories: [] });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    store: '',
    category: '',
    groupBy: 'date',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchDashboard(id);
  }, [id, fetchDashboard]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data } = await customDashboardAnalyticsApi.getFilters(id);
        setFilterOptions(data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    if (id) {
      fetchFilterOptions();
    }
  }, [id]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.store) params.append('store', filters.store);
        if (filters.category) params.append('category', filters.category);
        if (filters.groupBy) params.append('groupBy', filters.groupBy);

        const { data } = await customDashboardAnalyticsApi.getData(id, params);
        setAnalyticsData(data);
      } catch (error) {
        toast.error(formatApiError(error));
      } finally {
        setLoading(false);
      }
    };

    if (id && filters.groupBy) {
      fetchAnalytics();
    }
  }, [id, filters]);

  const totalRevenue = analyticsData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalTransactions = analyticsData.reduce((sum, item) => sum + (item.count || 0), 0);
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1
            className="mb-2 text-3xl font-black tracking-tighter sm:text-4xl"
            data-testid="dashboard-title"
          >
            {currentDashboard?.name || 'Dashboard'}
          </h1>
          {currentDashboard?.description ? (
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              {currentDashboard.description}
            </p>
          ) : null}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              From Date
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              data-testid="filter-date-from"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              To Date
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              data-testid="filter-date-to"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Store
            </label>
            <Select
              className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              data-testid="filter-store"
              value={filters.store}
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
              options={filterOptions.stores.map((store) => ({ value: store, label: store }))}
              placeholder="All Stores"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Category
            </label>
            <Select
              className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              data-testid="filter-category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={filterOptions.categories.map((category) => ({
                value: category,
                label: category,
              }))}
              placeholder="All Categories"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Group By
            </label>
            <Select
              className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              data-testid="filter-group-by"
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              options={[
                { value: 'date', label: 'Date' },
                { value: 'store', label: 'Store' },
                { value: 'category', label: 'Category' },
              ]}
              placeholder="Group By"
            />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="border border-gray-200 p-6" data-testid="stat-total-revenue">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Total Revenue
            </p>
            <p className="text-3xl font-black tracking-tighter">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="border border-gray-200 p-6" data-testid="stat-transactions">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Transactions
            </p>
            <p className="text-3xl font-black tracking-tighter">
              {totalTransactions.toLocaleString()}
            </p>
          </div>

          <div className="border border-gray-200 p-6" data-testid="stat-avg-transaction">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Avg Transaction
            </p>
            <p className="text-3xl font-black tracking-tighter">
              {formatCurrency(avgTransaction)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : analyticsData.length === 0 ? (
          <div className="border border-gray-200 py-12 text-center">
            <p className="mb-2 text-xl font-bold text-gray-800">No data available</p>
            <p className="text-sm text-gray-600">
              Upload and map Excel files to see analytics
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-full border border-gray-200 p-6" data-testid="line-chart">
              <h3 className="mb-4 text-xl font-bold tracking-tight">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#4B5563" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0 }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0A0A0A"
                    strokeWidth={2}
                    dot={{ fill: '#0A0A0A', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-full border border-gray-200 p-6" data-testid="bar-chart">
              <h3 className="mb-4 text-xl font-bold tracking-tight">Transaction Count</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#4B5563" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0 }} />
                  <Bar dataKey="count" fill="#002FA7" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-full border border-gray-200 p-6" data-testid="pie-chart">
              <h3 className="mb-4 text-xl font-bold tracking-tight">Revenue Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.slice(0, 5)}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.label}
                  >
                    {analyticsData.slice(0, 5).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0 }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-full border border-gray-200 p-6" data-testid="data-table">
              <h3 className="mb-4 text-xl font-bold tracking-tight">Data Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                        Label
                      </th>
                      <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                        Revenue
                      </th>
                      <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                        Count
                      </th>
                      <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-2 py-3 font-medium text-gray-800">{item.label}</td>
                        <td className="px-2 py-3 text-right text-gray-800">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-2 py-3 text-right text-gray-800">{item.count}</td>
                        <td className="px-2 py-3 text-right text-gray-800">
                          {formatCurrency(item.average)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
