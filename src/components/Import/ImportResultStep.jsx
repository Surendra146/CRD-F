import {
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Save,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Button from '../UI/button';
import { Card, CardContent } from '../UI/card.jsx';
import { formatNumber } from '../../utils/format';

function PreviewTable({ title, rows, type }) {
  if (!rows?.length) return null;

  return (
    <div className="mx-auto mt-6 max-w-6xl text-left">
      <h4 className="mb-2 text-sm font-semibold text-gray-800">{title}</h4>

      <div className="max-h-72 overflow-auto rounded-lg border bg-white">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Row</th>
              {type === 'error' ? (
                <th className="border px-3 py-2 text-left">Error</th>
              ) : null}
              <th className="border px-3 py-2 text-left">Preview Data</th>
            </tr>
          </thead>

          <tbody>
            {rows.slice(0, 20).map((item, index) => (
              <tr key={`${item.row || index}-${index}`}>
                <td className="border px-3 py-2">{item.row || '-'}</td>

                {type === 'error' ? (
                  <td className="border px-3 py-2 text-red-600">
                    {item.message || '-'}
                  </td>
                ) : null}

                <td className="border px-3 py-2">
                  <pre className="max-w-4xl whitespace-pre-wrap break-words">
                    {JSON.stringify(item.data || {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 20 ? (
        <p className="mt-2 text-xs text-gray-500">
          Showing first 20 preview rows.
        </p>
      ) : null}
    </div>
  );
}

export default function ImportResultStep({
  processingStatus,
  onReset,
  onConfirmSave,
  isSaving,
  onExportErrors,
}) {
  const navigate = useNavigate();
  const status = processingStatus.status;

  const isValidationDone = ['validated', 'validated_with_errors'].includes(status);
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  const validRows =
    processingStatus.stats?.validRows ||
    processingStatus.stats?.successRows ||
    0;

  const errorRows =
    processingStatus.stats?.invalidRows ||
    processingStatus.stats?.errorRows ||
    0;

  const hasErrors =
    processingStatus.errorPreview?.length > 0 ||
    processingStatus.errors?.length > 0 ||
    errorRows > 0;

  return (
    <Card>
      <CardContent className="py-12 text-center">
        {isCompleted || isValidationDone ? (
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        ) : isFailed ? (
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        ) : (
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
        )}

        <h3 className="mb-2 text-lg font-medium text-gray-900">
          {isCompleted
            ? 'Import Saved Successfully!'
            : isValidationDone
              ? 'Validation Complete. Review Before Saving.'
              : isFailed
                ? 'Import Failed'
                : 'Import Completed with Errors'}
        </h3>

        {isValidationDone ? (
          <p className="text-sm text-gray-500">
            Data is not saved yet. Click Yes to save only valid rows.
          </p>
        ) : null}

        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(processingStatus.stats?.totalRows || 0)}
            </p>
            <p className="text-sm text-gray-500">Total Rows</p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(validRows)}
            </p>
            <p className="text-sm text-gray-500">Valid Rows</p>
          </div>

          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-2xl font-bold text-red-600">
              {formatNumber(errorRows)}
            </p>
            <p className="text-sm text-gray-500">Error Rows</p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(processingStatus.stats?.savedRows || 0)}
            </p>
            <p className="text-sm text-gray-500">Saved Rows</p>
          </div>

          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-2xl font-bold text-purple-600">
              {formatNumber(processingStatus.stats?.newTransactions || 0)}
            </p>
            <p className="text-sm text-gray-500">Transactions</p>
          </div>
        </div>

        {isValidationDone ? (
          <>
            <PreviewTable
              title="Valid Data Preview"
              rows={processingStatus.validPreview || []}
              type="valid"
            />

            <PreviewTable
              title="Error Data Preview"
              rows={processingStatus.errorPreview || processingStatus.errors || []}
              type="error"
            />
          </>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Import More Data
          </Button>

          {isValidationDone && hasErrors ? (
            <Button variant="outline" onClick={onExportErrors}>
              <Download className="mr-2 h-4 w-4" />
              Export Error Excel
            </Button>
          ) : null}

          {isValidationDone ? (
            <Button onClick={onConfirmSave} disabled={isSaving || validRows === 0}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Yes, Save Valid Data'}
            </Button>
          ) : null}

          {isCompleted ? (
            <Button onClick={() => navigate('/customers/details')}>
              View Customers
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
