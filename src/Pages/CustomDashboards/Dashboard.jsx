import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDashboard } from '../../context/useDashboard';
import { useAuthStore } from '../../store/authstore';
import { normalizeAllowedModules } from '../../utils/moduleAccess';
import { Plus, ChartLine, Calendar, Trash } from '@phosphor-icons/react';
import { formatDate } from '../../utils/helpers';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/UI/dialog';
import Button from '../../components/UI/button';
import Input from '../../components/UI/input';
import Badge from '../../components/UI/badge';
import { Label } from '../../components/UI/label';
import { uploadsApi } from '../../services/uploads';
import { excelApi } from '../../services/excel';

const MAX_RANGE_DAYS = 92;

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFileExtension = (name = '') => {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex === -1 ? '' : name.slice(dotIndex + 1).toLowerCase();
};

const isExcelOrPdf = (fileName = '', mimeType = '') => {
  const extension = getFileExtension(fileName);
  if (['xlsx', 'xls', 'csv', 'pdf'].includes(extension)) return true;

  const normalizedMime = String(mimeType || '').toLowerCase();
  return normalizedMime.includes('sheet') || normalizedMime.includes('excel') || normalizedMime.includes('csv') || normalizedMime.includes('pdf');
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const DashboardList = () => {
  const { dashboards, loading, fetchDashboards, createDashboard, deleteDashboard } = useDashboard();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const today = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setMonth(defaultFromDate.getMonth() - 3);
  const {
    data: customerUploadHistoryData,
    isFetching: isUploadHistoryLoading,
    refetch: refetchUploadHistory,
  } = useQuery({
    queryKey: ['upload-history-report-module'],
    queryFn: () => uploadsApi.getHistory({ limit: 200 }),
  });
  const { data: customDashboardUploadHistoryData } = useQuery({
    queryKey: ['excel-upload-history-report-module'],
    queryFn: () => excelApi.getHistory({ limit: 200 }),
  });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    excelSourcesCount: 1,
    sourceNames: ['']
  });
  const [creating, setCreating] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState('customer_upload');
  const [fromDate, setFromDate] = useState(toDateInputValue(defaultFromDate));
  const [toDate, setToDate] = useState(toDateInputValue(today));
  
  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);
  
  const handleSourceCountChange = (count) => {
    const num = parseInt(count) || 1;
    const newSourceNames = Array(num).fill('').map((_, i) => 
      formData.sourceNames[i] || `Source ${i + 1}`
    );
    setFormData({ ...formData, excelSourcesCount: num, sourceNames: newSourceNames });
  };
  
  const handleSourceNameChange = (index, value) => {
    const newSourceNames = [...formData.sourceNames];
    newSourceNames[index] = value;
    setFormData({ ...formData, sourceNames: newSourceNames });
  };
  
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Dashboard name is required');
      return;
    }
    
    const hasEmptySource = formData.sourceNames.some(name => !name.trim());
    if (hasEmptySource) {
      toast.error('All source names are required');
      return;
    }
    
    setCreating(true);
    try {
      const dashboard = await createDashboard(formData);
      toast.success('Dashboard created successfully!');
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', excelSourcesCount: 1, sourceNames: [''] });
      if (dashboard?._id) {
        navigate(`/dashboards/${dashboard._id}/upload`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create dashboard');
    } finally {
      setCreating(false);
    }
  };
  
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await deleteDashboard(id);
        toast.success('Dashboard deleted');
      } catch {
        toast.error('Failed to delete dashboard');
      }
    }
  };
  
  const canCreateOrDelete = normalizeAllowedModules(user?.allowedModules).includes('custom-dashboards');

  const customerUploadEntries = useMemo(() => {
    const uploads = Array.isArray(customerUploadHistoryData?.data) ? customerUploadHistoryData.data : [];

    return uploads
      .filter((upload) => isExcelOrPdf(upload?.file?.originalName, upload?.file?.mimeType))
      .map((upload) => ({
        id: `customer-${upload._id}`,
        moduleType: 'customer_upload',
        createdAt: upload.createdAt,
        fileName: upload.file?.originalName || 'Uploaded file',
        mimeType: upload.file?.mimeType || '',
        status: upload.status || 'pending',
        rows: upload.stats?.totalRows || 0,
        sourceLabel: upload.type === 'customer_sales' ? 'Customer Sales' : 'Customer Details',
      }));
  }, [customerUploadHistoryData]);

  const customDashboardUploadEntries = useMemo(() => {
    const uploads = Array.isArray(customDashboardUploadHistoryData?.data)
      ? customDashboardUploadHistoryData.data
      : [];

    return uploads
      .filter((upload) => isExcelOrPdf(upload?.file?.originalName, upload?.file?.mimeType))
      .map((upload) => ({
        id: `dashboard-${upload._id}`,
        moduleType: 'custom_dashboard',
        createdAt: upload.createdAt || upload.updatedAt,
        fileName: upload.file?.originalName || 'Uploaded file',
        mimeType: upload.file?.mimeType || '',
        status: upload.status || 'uploaded',
        rows: upload.stats?.totalRows || 0,
        sourceLabel: upload.sourceName || 'Custom Dashboard',
      }));
  }, [customDashboardUploadHistoryData]);

  const filteredRecentUploads = useMemo(() => {
    const from = parseDateValue(fromDate);
    const to = parseDateValue(toDate);

    if (!from || !to) return [];

    const allUploads = [...customerUploadEntries, ...customDashboardUploadEntries];
    const dayStart = startOfDay(from).getTime();
    const dayEnd = endOfDay(to).getTime();

    return allUploads
      .filter((item) => item.moduleType === selectedUploadType)
      .filter((item) => {
        const createdAtValue = parseDateValue(item.createdAt);
        if (!createdAtValue) return false;
        const time = createdAtValue.getTime();
        return time >= dayStart && time <= dayEnd;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerUploadEntries, customDashboardUploadEntries, selectedUploadType, fromDate, toDate]);

  const validateAndSetDateRange = (nextFromDate, nextToDate) => {
    const parsedFrom = parseDateValue(nextFromDate);
    const parsedTo = parseDateValue(nextToDate);

    if (!parsedFrom || !parsedTo) return;
    if (parsedFrom > parsedTo) {
      toast.error('From date cannot be later than To date');
      return;
    }

    const msDiff = endOfDay(parsedTo).getTime() - startOfDay(parsedFrom).getTime();
    const dayDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

    if (dayDiff > MAX_RANGE_DAYS) {
      toast.error('Date range cannot exceed 3 months');
      return;
    }

    setFromDate(nextFromDate);
    setToDate(nextToDate);
  };
  
  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Reports</h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Parent module for analytics and report sub modules
            </p>
          </div>
          
          {canCreateOrDelete && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="primary"
                  className="rounded-none px-6 py-3 font-bold uppercase tracking-widest text-sm"
                  data-testid="create-dashboard-button"
                >
                  <Plus size={18} weight="bold" className="mr-2" />
                  New Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-2 border-black">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter">Create Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Dashboard Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Q1 Sales Dashboard"
                      className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                      data-testid="dashboard-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Track quarterly sales metrics"
                      className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                      data-testid="dashboard-description-input"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Number of Excel Sources</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.excelSourcesCount}
                      onChange={(e) => handleSourceCountChange(e.target.value)}
                      className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                      data-testid="excel-sources-count-input"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3 block">Source Names</Label>
                    <div className="space-y-2">
                      {formData.sourceNames.map((name, index) => (
                        <Input
                          key={index}
                          value={name}
                          onChange={(e) => handleSourceNameChange(index, e.target.value)}
                          placeholder={`Source ${index + 1}`}
                          className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                          data-testid={`source-name-input-${index}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    variant="primary"
                    className="w-full rounded-none py-3 font-bold uppercase tracking-widest text-sm"
                    data-testid="create-dashboard-submit"
                  >
                    {creating ? 'Creating...' : 'Create Dashboard'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mb-8 border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold tracking-tight">Recent Upload List</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchUploadHistory()}
              disabled={isUploadHistoryLoading}
            >
              {isUploadHistoryLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 border-b border-gray-200 px-6 py-4 md:grid-cols-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Upload Type</Label>
              <select
                value={selectedUploadType}
                onChange={(event) => setSelectedUploadType(event.target.value)}
                className="mt-2 w-full rounded-none border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="customer_upload">Customer Upload</option>
                <option value="custom_dashboard">Custom Dashboard</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => validateAndSetDateRange(event.target.value, toDate)}
                className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => validateAndSetDateRange(fromDate, event.target.value)}
                className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          {filteredRecentUploads.length ? (
            <div className="divide-y">
              {filteredRecentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {upload.fileName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(upload.createdAt)} | {upload.sourceLabel} | {(upload.rows || 0).toLocaleString()} rows
                    </p>
                  </div>
                  <Badge
                    variant={
                      upload.status === 'completed'
                        ? 'success'
                        : upload.status === 'failed'
                          ? 'danger'
                          : upload.status === 'partial'
                            ? 'warning'
                            : 'default'
                    }
                  >
                    {upload.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-gray-500">No recent uploads</p>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading dashboards...</p>
          </div>
        ) : dashboards.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-none" data-testid="empty-state">
            <ChartLine size={48} weight="bold" className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-800 mb-2">No dashboards yet</p>
            <p className="text-sm text-gray-600">Create your first dashboard to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {dashboards.filter((dashboard) => dashboard?._id).map((dashboard) => (
              <div
                key={dashboard._id}
                onClick={() => navigate(`/dashboards/${dashboard._id}`)}
                className="border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:border-black group"
                data-testid={`dashboard-card-${dashboard._id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-black">
                      {dashboard.name}
                    </h3>
                    {dashboard.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {dashboard.description}
                      </p>
                    )}
                  </div>
                  
                  {canCreateOrDelete && (
                    <Button
                      onClick={(e) => handleDelete(dashboard._id, e)}
                      variant="ghost"
                      size="sm"
                      className="rounded-none border border-gray-200 hover:bg-red-50 hover:text-red-600"
                      data-testid={`delete-dashboard-${dashboard._id}`}
                    >
                      <Trash size={16} weight="bold" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} weight="bold" />
                    <span>{formatDate(dashboard.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartLine size={14} weight="bold" />
                    <span>{dashboard.excelSourcesConfig?.length || 0} Sources</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardList;
