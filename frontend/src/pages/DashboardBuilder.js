import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { useDashboard } from '../context/DashboardContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarBlank, Storefront, Tag } from '@phosphor-icons/react';
import { toast } from 'sonner';
import api, { formatApiError } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';

const CHART_COLORS = ['#0A0A0A', '#002FA7', '#FF2A2A', '#FFC800', '#4B5563'];

const DashboardBuilder = () => {
  const { id } = useParams();
  const { currentDashboard, fetchDashboard } = useDashboard();
  
  const [analyticsData, setAnalyticsData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ stores: [], categories: [] });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    store: '',
    category: '',
    groupBy: 'date'
  });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchDashboard(id);
      fetchFilterOptions();
      fetchAnalytics();
    }
  }, [id]);
  
  useEffect(() => {
    if (filters.groupBy) {
      fetchAnalytics();
    }
  }, [filters]);
  
  const fetchFilterOptions = async () => {
    try {
      const { data } = await api.get(`/api/analytics/${id}/filters`);
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };
  
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.store) params.append('store', filters.store);
      if (filters.category) params.append('category', filters.category);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);
      
      const { data } = await api.get(`/api/analytics/${id}?${params.toString()}`);
      setAnalyticsData(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const totalRevenue = analyticsData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalTransactions = analyticsData.reduce((sum, item) => sum + (item.count || 0), 0);
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2" data-testid="dashboard-title">
            {currentDashboard?.name || 'Dashboard'}
          </h1>
          {currentDashboard?.description && (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {currentDashboard.description}
            </p>
          )}
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
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
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
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
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
              Store
            </label>
            <Select value={filters.store} onValueChange={(val) => setFilters({ ...filters, store: val })}>
              <SelectTrigger className="rounded-none border-gray-200 focus:ring-2 focus:ring-black" data-testid="filter-store">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stores</SelectItem>
                {filterOptions.stores.map((store) => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
              Category
            </label>
            <Select value={filters.category} onValueChange={(val) => setFilters({ ...filters, category: val })}>
              <SelectTrigger className="rounded-none border-gray-200 focus:ring-2 focus:ring-black" data-testid="filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {filterOptions.categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
              Group By
            </label>
            <Select value={filters.groupBy} onValueChange={(val) => setFilters({ ...filters, groupBy: val })}>
              <SelectTrigger className="rounded-none border-gray-200 focus:ring-2 focus:ring-black" data-testid="filter-group-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="store">Store</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 p-6" data-testid="stat-total-revenue">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Total Revenue</p>
            <p className="text-3xl font-black tracking-tighter">{formatCurrency(totalRevenue)}</p>
          </div>
          
          <div className="border border-gray-200 p-6" data-testid="stat-transactions">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Transactions</p>
            <p className="text-3xl font-black tracking-tighter">{totalTransactions.toLocaleString()}</p>
          </div>
          
          <div className="border border-gray-200 p-6" data-testid="stat-avg-transaction">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Avg Transaction</p>
            <p className="text-3xl font-black tracking-tighter">{formatCurrency(avgTransaction)}</p>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : analyticsData.length === 0 ? (
          <div className="text-center py-12 border border-gray-200">
            <p className="text-xl font-bold text-gray-800 mb-2">No data available</p>
            <p className="text-sm text-gray-600">Upload and map Excel files to see analytics</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 p-6 h-full" data-testid="line-chart">
              <h3 className="text-xl font-bold tracking-tight mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#4B5563" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#4B5563" />
                  <Tooltip 
                    contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0 }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line type="monotone" dataKey="total" stroke="#0A0A0A" strokeWidth={2} dot={{ fill: '#0A0A0A', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border border-gray-200 p-6 h-full" data-testid="bar-chart">
              <h3 className="text-xl font-bold tracking-tight mb-4">Transaction Count</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#4B5563" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#4B5563" />
                  <Tooltip 
                    contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0 }}
                  />
                  <Bar dataKey="count" fill="#002FA7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border border-gray-200 p-6 h-full" data-testid="pie-chart">
              <h3 className="text-xl font-bold tracking-tight mb-4">Revenue Distribution</h3>
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
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0 }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border border-gray-200 p-6 h-full" data-testid="data-table">
              <h3 className="text-xl font-bold tracking-tight mb-4">Data Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Label</th>
                      <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Revenue</th>
                      <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Count</th>
                      <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-2 text-gray-800 font-medium">{item.label}</td>
                        <td className="py-3 px-2 text-right text-gray-800">{formatCurrency(item.total)}</td>
                        <td className="py-3 px-2 text-right text-gray-800">{item.count}</td>
                        <td className="py-3 px-2 text-right text-gray-800">{formatCurrency(item.average)}</td>
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
};

export default DashboardBuilder;
