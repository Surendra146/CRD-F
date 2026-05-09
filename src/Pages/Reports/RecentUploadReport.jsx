import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import Badge from '../../components/UI/badge';
import Button from '../../components/UI/button';
import Input from '../../components/UI/input';
import { Label } from '../../components/ui/label';
import { uploadsApi } from '../../services/uploads';
import { excelApi } from '../../services/excel';
import { formatDate } from '../../utils/helpers';

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

export default function RecentUploadReport() {
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

  const [selectedUploadType, setSelectedUploadType] = useState('customer_upload');
  const [fromDate, setFromDate] = useState(toDateInputValue(defaultFromDate));
  const [toDate, setToDate] = useState(toDateInputValue(today));

  const customerUploadEntries = useMemo(() => {
    const uploads = Array.isArray(customerUploadHistoryData?.data) ? customerUploadHistoryData.data : [];
    return uploads
      .filter((upload) => isExcelOrPdf(upload?.file?.originalName, upload?.file?.mimeType))
      .map((upload) => ({
        id: `customer-${upload._id}`,
        moduleType: 'customer_upload',
        createdAt: upload.createdAt,
        fileName: upload.file?.originalName || 'Uploaded file',
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Recent upload report by module and date range.</p>
        </div>

        <div className="mb-8 border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold tracking-tight">Recent Upload Report</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => refetchUploadHistory()} disabled={isUploadHistoryLoading}>
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
              <Input type="date" value={fromDate} onChange={(event) => validateAndSetDateRange(event.target.value, toDate)} className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">To Date</Label>
              <Input type="date" value={toDate} onChange={(event) => validateAndSetDateRange(fromDate, event.target.value)} className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black" />
            </div>
          </div>
          {filteredRecentUploads.length ? (
            <div className="divide-y">
              {filteredRecentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{upload.fileName}</p>
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
      </div>
    </div>
  );
}
