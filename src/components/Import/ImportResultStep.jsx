import { AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';

import Button from '../UI/button';
import { Card, CardContent } from '../UI/card.jsx';
import { formatNumber } from '../../utils/format';

export default function ImportResultStep({ processingStatus, onReset }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        {processingStatus.status === 'completed' ? (
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        ) : processingStatus.status === 'partial' ? (
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
        ) : (
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        )}

        <h3 className="mb-2 text-lg font-medium text-gray-900">
          {processingStatus.status === 'completed'
            ? 'Import Complete!'
            : processingStatus.status === 'partial'
              ? 'Import Completed with Errors'
              : 'Import Failed'}
        </h3>

        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(processingStatus.stats?.totalRows || 0)}
            </p>
            <p className="text-sm text-gray-500">Total Rows</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(processingStatus.stats?.successRows || 0)}
            </p>
            <p className="text-sm text-gray-500">Successful</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(processingStatus.stats?.newCustomers || 0)}
            </p>
            <p className="text-sm text-gray-500">New Customers</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-2xl font-bold text-red-600">
              {formatNumber(processingStatus.stats?.errorRows || 0)}
            </p>
            <p className="text-sm text-gray-500">Errors</p>
          </div>
        </div>

        {processingStatus.errors?.length > 0 ? (
          <div className="mx-auto mt-6 max-w-2xl text-left">
            <h4 className="mb-2 text-sm font-medium text-gray-700">Errors</h4>
            <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 p-4">
              {processingStatus.errors.slice(0, 10).map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  Row {error.row || '-'}: {error.message}
                </p>
              ))}
              {processingStatus.errors.length > 10 ? (
                <p className="mt-2 text-sm text-red-500">
                  ...and {processingStatus.errors.length - 10} more errors
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Import More Data
          </Button>
          <Button onClick={() => window.location.assign('/customers')}>View Customers</Button>
        </div>
      </CardContent>
    </Card>
  );
}
