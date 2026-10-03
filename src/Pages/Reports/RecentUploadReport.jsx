import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

import Button from '../../components/UI/button';
import Input from '../../components/UI/input';
import { Label } from '../../components/UI/label';
import { uploadsApi } from '../../services/uploads';

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

const isDateRangeValid = (fromDate, toDate) => {
  const from = parseDateValue(fromDate);
  const to = parseDateValue(toDate);
  if (!from || !to) return false;
  if (from > to) return false;
  const msDiff = to.getTime() - from.getTime();
  const dayDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  return dayDiff <= MAX_RANGE_DAYS;
};

export default function RecentUploadReport() {
  const today = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setMonth(defaultFromDate.getMonth() - 3);

  const [reportType, setReportType] = useState('user_wise');
  const [userId, setUserId] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [fromDate, setFromDate] = useState(toDateInputValue(defaultFromDate));
  const [toDate, setToDate] = useState(toDateInputValue(today));
  const [generated, setGenerated] = useState(false);
  const [generatedTotal, setGeneratedTotal] = useState(0);
  const [generating, setGenerating] = useState(false);

  const optionsQuery = useQuery({
    queryKey: ['recent-upload-report-options'],
    queryFn: () => uploadsApi.getRecentUploadReportOptions(),
  });

  const users = Array.isArray(optionsQuery.data?.data?.users) ? optionsQuery.data.data.users : [];
  const uploadTypes = Array.isArray(optionsQuery.data?.data?.uploadTypes)
    ? optionsQuery.data.data.uploadTypes
    : [];

  const queryParams = useMemo(
    () => ({
      reportType,
      userId: reportType === 'user_wise' ? userId || undefined : undefined,
      uploadType: reportType === 'uploaded_excel_type_wise' ? uploadType || undefined : undefined,
      fromDate,
      toDate,
      limit: 5000,
    }),
    [reportType, userId, uploadType, fromDate, toDate]
  );

  const validateFilters = () => {
    if (!isDateRangeValid(fromDate, toDate)) {
      toast.error('Please choose a valid date range within 3 months');
      return false;
    }
    if (reportType === 'user_wise' && !userId) {
      toast.error('Please select a user');
      return false;
    }
    if (reportType === 'uploaded_excel_type_wise' && !uploadType) {
      toast.error('Please select uploaded excel type');
      return false;
    }
    return true;
  };

  const handleGenerateReport = async () => {
    if (!validateFilters()) return;
    try {
      setGenerating(true);
      const response = await uploadsApi.getRecentUploadReport(queryParams);
      const total = Number(response?.data?.total || 0);
      setGenerated(true);
      setGeneratedTotal(total);
      toast.success(`Report generated successfully. ${total} record(s) matched.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = async () => {
    if (!validateFilters()) return;
    try {
      await uploadsApi.exportRecentUploadReportExcel(queryParams);
      toast.success('Excel report exported successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export Excel report');
    }
  };

  const handleGeneratePdf = async () => {
    if (!validateFilters()) return;
    try {
      await uploadsApi.exportRecentUploadReportPdf(queryParams);
      toast.success('PDF report generated successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate PDF report');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 md:p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">Reports</h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Generate enterprise reports with filters and export directly to Excel/PDF.
          </p>
        </div>

        <div className="border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold tracking-tight">Recent Upload Report Generator</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Report Type</Label>
              <select
                value={reportType}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setReportType(nextType);
                  setGenerated(false);
                }}
                className="mt-2 w-full rounded-none border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="user_wise">User Wise</option>
                <option value="uploaded_excel_type_wise">Uploaded Excel Type Wise</option>
              </select>
            </div>

            {reportType === 'user_wise' ? (
              <div>
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">User</Label>
                <select
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                    setGenerated(false);
                  }}
                  className="mt-2 w-full rounded-none border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Uploaded Excel Type</Label>
                <select
                  value={uploadType}
                  onChange={(event) => {
                    setUploadType(event.target.value);
                    setGenerated(false);
                  }}
                  className="mt-2 w-full rounded-none border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select Uploaded Excel Type</option>
                  {uploadTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setGenerated(false);
                }}
                className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setGenerated(false);
                }}
                className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 px-6 py-4">
            <Button type="button" onClick={handleGenerateReport} isLoading={generating || optionsQuery.isLoading}>
              Generate Report
            </Button>
            <Button type="button" variant="outline" onClick={handleExportExcel} disabled={!generated}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button type="button" variant="outline" onClick={handleGeneratePdf} disabled={!generated}>
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              {generated
                ? `Report is ready. ${generatedTotal} record(s) matched. Use Export Excel or Generate PDF.`
                : 'No report data is displayed on screen. Generate and export to download the report.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
