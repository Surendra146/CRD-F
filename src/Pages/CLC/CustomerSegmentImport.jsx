import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import Loader from '../../components/UI/loader.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/UI/table.jsx';
import { segmentsApi } from '../../services/segments.js';

const MAX_ERROR_ROWS = 100;

export default function CustomerSegmentImport() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [saveSummary, setSaveSummary] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const generateTemplateMutation = useMutation({
    mutationFn: () => segmentsApi.downloadImportTemplate(),
    onError: () => {
      toast.error('Failed to generate template');
    },
  });

  const validateMutation = useMutation({
    mutationFn: (file) => segmentsApi.validateImportFile(file),
    onSuccess: (response) => {
      const data = response?.data || response || {};
      setValidationResult(data);
      toast.success('Validation completed');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Validation failed');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (validRows) => segmentsApi.saveValidatedRows(validRows),
    onSuccess: (response) => {
      const savedRows = response?.data?.savedRows || 0;
      const totalRows = validationResult?.totalRows || 0;
      const errorCount = validationResult?.errorCount || 0;
      toast.success(
        `Customer-Segment mapping saved successfully. Saved ${savedRows} valid row(s). ${
          errorCount > 0 ? `${errorCount} row(s) failed validation.` : `All ${totalRows} row(s) were valid.`
        }`
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-segments'] });

      // Reset to a fresh upload state after successful save
      setSelectedFile(null);
      setValidationResult(null);
      setSaveSummary(null);
      setFileInputKey((prev) => prev + 1);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Save failed');
    },
  });

  const handleImportValidate = () => {
    if (!selectedFile) {
      toast.error('Please choose a file first');
      return;
    }
    validateMutation.mutate(selectedFile);
  };

  const handleSave = () => {
    const validRows = validationResult?.validRows || [];

    if (!validRows.length) {
      toast.error('No valid rows to save');
      return;
    }

    saveMutation.mutate(validRows);
  };

  const errorRows = Array.isArray(validationResult?.errors)
    ? validationResult.errors.slice(0, MAX_ERROR_ROWS)
    : [];

  const handleExportErrors = async () => {
    const errors = Array.isArray(validationResult?.errors) ? validationResult.errors : [];
    if (!errors.length) {
      toast.error('No invalid rows available to export');
      return;
    }

    try {
      await segmentsApi.exportImportErrors(errors);
      toast.success('Error list exported successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export error list');
    }
  };

  return (
    <div>
      <Header
        title="Customer Segment Excel Import"
        subtitle="Generate template, import and validate, then save valid segment updates"
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Import Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => generateTemplateMutation.mutate()}
                isLoading={generateTemplateMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Excel
              </Button>

              <input
                key={fileInputKey}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  setValidationResult(null);
                  setSaveSummary(null);
                }}
                className="max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />

              <Button
                type="button"
                onClick={handleImportValidate}
                isLoading={validateMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>

              <Button
                type="button"
                variant="success"
                onClick={handleSave}
                isLoading={saveMutation.isPending}
                disabled={!validationResult?.validRows?.length}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>

            {selectedFile ? (
              <p className="text-sm text-gray-600">Selected file: {selectedFile.name}</p>
            ) : null}
          </CardContent>
        </Card>

        {validateMutation.isPending ? (
          <Card>
            <CardContent className="py-10">
              <Loader size="lg" />
            </CardContent>
          </Card>
        ) : null}

        {validationResult ? (
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Total Rows</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{validationResult.totalRows || 0}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-xs uppercase tracking-wide text-green-700">Valid Rows</p>
                <p className="mt-1 text-xl font-semibold text-green-800">{validationResult.validCount || 0}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs uppercase tracking-wide text-red-700">Error Rows</p>
                <p className="mt-1 text-xl font-semibold text-red-800">{validationResult.errorCount || 0}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {saveSummary ? (
          <Card>
            <CardHeader>
              <CardTitle>Save Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Total Rows</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{saveSummary.totalRows || 0}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-xs uppercase tracking-wide text-green-700">Saved Rows</p>
                <p className="mt-1 text-xl font-semibold text-green-800">{saveSummary.savedRows || 0}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs uppercase tracking-wide text-red-700">Failed Rows</p>
                <p className="mt-1 text-xl font-semibold text-red-800">{saveSummary.failedRows || 0}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {errorRows.length ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Error List</CardTitle>
                <Button type="button" variant="outline" onClick={handleExportErrors}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Error List
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Customer Code</TableHead>
                    <TableHead>Segment Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorRows.map((error, index) => (
                    <TableRow key={`${error.row}-${index}`}>
                      <TableCell>{error.row || '-'}</TableCell>
                      <TableCell>{error.message || '-'}</TableCell>
                      <TableCell>{error?.data?.customerCode || '-'}</TableCell>
                      <TableCell>{error?.data?.segmentCode || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
