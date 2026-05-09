import { FileSpreadsheet } from 'lucide-react';

import Badge from '../UI/badge';
import Button from '../UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/card.jsx';
import Loader from '../UI/loader';
import Select from '../UI/select';
import { formatDate, formatNumber } from '../../utils/format';
import { importTypeOptions } from './importConstants';

export default function ImportUploadStep({
  getRootProps,
  getInputProps,
  isDragActive,
  isUploading,
  historyData,
  isRecentUploadsCleared,
  maxFileSizeMb,
  importType,
  onImportTypeChange,
  onRefreshRecentUploads,
}) {
  const recentUploads = isRecentUploadsCleared ? [] : historyData?.data || [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Data File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select
                label="Import Type"
                value={importType}
                onChange={(event) => onImportTypeChange(event.target.value)}
                options={importTypeOptions}
                placeholder="Select import type"
              />
            </div>
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              {isUploading ? (
                <div>
                  <Loader className="mx-auto mb-2" />
                  <p className="text-gray-600">Uploading...</p>
                </div>
              ) : isDragActive ? (
                <p className="font-medium text-primary-600">Drop your file here</p>
              ) : (
                <>
                  <p className="mb-2 text-gray-600">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports CSV, XLSX, XLS (Max {maxFileSizeMb}MB)
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Uploads</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={onRefreshRecentUploads}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentUploads.length ? (
              <div className="divide-y">
                {recentUploads.map((upload) => (
                  <div key={upload._id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{upload.file.originalName}</p>
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
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(upload.createdAt)} | {formatNumber(upload.stats.totalRows)} rows
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-gray-500">No recent uploads</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
