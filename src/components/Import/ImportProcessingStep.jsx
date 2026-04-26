import { Wifi, WifiOff } from 'lucide-react';

import { Card, CardContent } from '../UI/card.jsx';
import Loader from '../UI/loader';
import { formatNumber } from '../../utils/format';

export default function ImportProcessingStep({
  socketState,
  progressProcessed,
  progressTotal,
  progressPercent,
  debugEvents,
  uploadId,
}) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Loader size="lg" className="mx-auto mb-4" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">Processing Your Data</h3>
        <p className="text-gray-500">
          Progress now streams live from the backend worker instead of polling.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          {socketState === 'connected' ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span>Live updates connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-500" />
              <span>Reconnecting live updates...</span>
            </>
          )}
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {formatNumber(progressProcessed)} / {formatNumber(progressTotal)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-lg border bg-gray-50 p-4 text-left">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Debug Timeline</h4>
            <span className="text-xs text-gray-500">Upload ID: {uploadId || 'N/A'}</span>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto font-mono text-xs">
            {debugEvents.length > 0 ? (
              debugEvents.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="rounded border bg-white p-2">
                  <div className="text-gray-900">
                    [{event.timestamp}] {event.message}
                  </div>
                  {event.details ? (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-gray-600">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No debug events captured yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
