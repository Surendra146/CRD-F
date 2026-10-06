import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Filter,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Send,
  UserPlus,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/UI/button.jsx';
import Badge from '../../../components/UI/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/card.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/UI/table.jsx';
import { marketingToolsApi } from '../../../services/marketingTools.js';
import { customersApi } from '../../../services/customers.js';
import { formatNumber } from '../../../utils/format.js';

export default function NumberFilterTab({ onSendToBulkMarketing }) {
  const queryClient = useQueryClient();

  const [rawNumbers, setRawNumbers] = useState('');
  const [defaultCountryCode, setDefaultCountryCode] = useState('+91');
  const [filterResult, setFilterResult] = useState(null);
  const [activeListTab, setActiveListTab] = useState('valid'); // 'valid', 'invalid', 'duplicates'

  const filterMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.filterNumbers(data),
    onSuccess: (res) => {
      setFilterResult(res?.data || null);
      toast.success(
        `Filtering complete: ${res?.data?.summary?.valid_count || 0} numbers with valid formatting. WhatsApp availability was not checked.`
      );
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to filter numbers');
    },
  });

  const handleFilter = (e) => {
    e?.preventDefault();
    if (!rawNumbers.trim()) {
      toast.error('Please paste or upload phone numbers first');
      return;
    }
    filterMutation.mutate({
      numbers: rawNumbers,
      default_country_code: defaultCountryCode,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawNumbers(content);
        toast.success(`Loaded file: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (items) => {
    if (!items?.length) return;
    const text = items.map((i) => i.formatted || i.original).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${items.length} numbers to clipboard!`);
  };

  const exportCsv = (items, filename) => {
    if (!items?.length) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Original,Formatted,Reason'].join(',') +
      '\n' +
      items.map((i) => `"${i.original || ''}","${i.formatted || ''}","${i.reason || ''}"`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded CSV');
  };

  // Import to Customers
  const [importingToCustomers, setImportingToCustomers] = useState(false);
  const handleImportValidCustomers = async () => {
    const validList = filterResult?.valid || [];
    if (!validList.length) {
      toast.error('No valid numbers to import');
      return;
    }

    setImportingToCustomers(true);
    try {
      let created = 0;
      for (const item of validList) {
        try {
          await customersApi.create({
            name: `Contact ${item.formatted.slice(-4)}`,
            phone: item.formatted,
            whatsapp_number: item.formatted,
            lifecycle: { segment: 'leads', status: 'new' },
            tags: ['filtered-number', 'bulk-lead'],
            isActive: true,
          });
          created++;
        } catch {
          // ignore duplicate
        }
      }
      toast.success(`Imported ${created} numbers into Customer Database!`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-customers'] });
    } catch {
      toast.error('Failed to import some contacts');
    } finally {
      setImportingToCustomers(false);
    }
  };

  const handleSendToBulk = () => {
    const validList = filterResult?.valid || [];
    if (!validList.length) {
      toast.error('No valid numbers to send to');
      return;
    }
    if (onSendToBulkMarketing) {
      onSendToBulkMarketing(validList.map((v) => ({ name: `Contact ${v.formatted.slice(-4)}`, phone: v.formatted })));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-600 p-2 text-white shadow-sm">
              <Filter className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">WhatsApp Number Filter & Validator</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Clean and sanitize bulk phone number lists, remove duplicates, format to international E.164 standard, and filter active numbers for zero-bounce campaigns.
          </p>
        </div>

        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
            <span className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload TXT / CSV File
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column (Input & Country Code) */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Input Raw Phone Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Default Country Code</label>
              <select
                value={defaultCountryCode}
                onChange={(e) => setDefaultCountryCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800"
              >
                <option value="+91">+91 (India)</option>
                <option value="+1">+1 (USA / Canada)</option>
                <option value="+44">+44 (United Kingdom)</option>
                <option value="+971">+971 (United Arab Emirates)</option>
                <option value="+65">+65 (Singapore)</option>
                <option value="+61">+61 (Australia)</option>
                <option value="+966">+966 (Saudi Arabia)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Paste Numbers (1 per line or comma separated)</label>
                <span className="text-[11px] text-gray-400">
                  {rawNumbers.split(/[\r\n,;]+/).filter((s) => s.trim()).length} lines
                </span>
              </div>
              <textarea
                rows={12}
                value={rawNumbers}
                onChange={(e) => setRawNumbers(e.target.value)}
                placeholder="9876543210&#10;+91 9988776655&#10;08877665544&#10;invalid-number-123&#10;9876543210 (duplicate)"
                className="w-full rounded-xl border border-gray-300 p-3 text-xs font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleFilter}
              isLoading={filterMutation.isPending}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter & Sanitize Numbers
            </Button>
          </CardContent>
        </Card>

        {/* Right Column (Results & Breakdown) */}
        <div className="xl:col-span-2 space-y-4">
          {filterResult ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
                  <p className="text-xs text-gray-500">Total Scanned</p>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(filterResult.summary.total_input)}</p>
                </div>

                <div
                  onClick={() => setActiveListTab('valid')}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    activeListTab === 'valid'
                      ? 'border-emerald-500 bg-emerald-50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-emerald-50/50'
                  }`}
                >
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Valid Numbers
                  </p>
                  <p className="text-xl font-bold text-emerald-800">
                    {formatNumber(filterResult.summary.valid_count)}
                  </p>
                </div>

                <div
                  onClick={() => setActiveListTab('invalid')}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    activeListTab === 'invalid'
                      ? 'border-red-500 bg-red-50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-red-50/50'
                  }`}
                >
                  <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                    Invalid Numbers
                  </p>
                  <p className="text-xl font-bold text-red-800">
                    {formatNumber(filterResult.summary.invalid_count)}
                  </p>
                </div>

                <div
                  onClick={() => setActiveListTab('duplicates')}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    activeListTab === 'duplicates'
                      ? 'border-amber-500 bg-amber-50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-amber-50/50'
                  }`}
                >
                  <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5 text-amber-600" />
                    Duplicates Removed
                  </p>
                  <p className="text-xl font-bold text-amber-800">
                    {formatNumber(filterResult.summary.duplicate_count)}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Actions for Valid Numbers:</span>
                  <Badge variant="success">{filterResult.summary.valid_count} Active</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(filterResult.valid)}
                    disabled={filterResult.valid.length === 0}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy Valid
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportCsv(filterResult.valid, 'valid_whatsapp_numbers.csv')}
                    disabled={filterResult.valid.length === 0}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Export CSV
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImportValidCustomers}
                    isLoading={importingToCustomers}
                    disabled={filterResult.valid.length === 0}
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Import to Customers
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSendToBulk}
                    disabled={filterResult.valid.length === 0}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Launch WhatsApp Campaign
                  </Button>
                </div>
              </div>

              {/* Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm capitalize flex items-center gap-2">
                    {activeListTab === 'valid' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    {activeListTab === 'invalid' && <XCircle className="h-4 w-4 text-red-600" />}
                    {activeListTab === 'duplicates' && <Copy className="h-4 w-4 text-amber-600" />}
                    {activeListTab} Numbers List ({filterResult[activeListTab]?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Original Input</TableHead>
                          <TableHead>Formatted E.164</TableHead>
                          <TableHead>Status / Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(filterResult[activeListTab] || []).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-gray-400 font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-xs text-gray-700">{row.original}</TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-gray-900">
                              {row.formatted || '—'}
                            </TableCell>
                            <TableCell>
                              {activeListTab === 'valid' && (
                                <Badge variant="success">WhatsApp Ready</Badge>
                              )}
                              {activeListTab === 'invalid' && (
                                <Badge variant="destructive">{row.reason || 'Invalid Format'}</Badge>
                              )}
                              {activeListTab === 'duplicates' && (
                                <Badge variant="warning">Duplicate Dropped</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500 space-y-2">
                <Filter className="h-10 w-10 mx-auto text-gray-300" />
                <p className="font-medium text-gray-800">No filter job run yet</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Paste mobile numbers or upload a list on the left, then click "Filter & Sanitize Numbers" to generate a zero-bounce clean contact list.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
