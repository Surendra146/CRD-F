import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Send,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/UI/button.jsx';
import Badge from '../../../components/UI/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/card.jsx';
import Modal from '../../../components/UI/modal.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/UI/table.jsx';
import { communicationsApi } from '../../../services/communications.js';
import { formatDate, formatNumber } from '../../../utils/format.js';

// The backend stores these timestamps as UTC without an offset.
function formatSchedule(value) {
  const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(utcValue).toLocaleString();
}

export default function ScheduledQueueTab() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState(null);

  const bulkJobsQuery = useQuery({
    queryKey: ['whatsapp-bulk-jobs'],
    queryFn: () => communicationsApi.getBulkJobs({ limit: 50 }),
    refetchInterval: 10000,
  });

  const rawList = bulkJobsQuery.data?.data || bulkJobsQuery.data?.items || bulkJobsQuery.data || [];
  const jobs = Array.isArray(rawList) ? rawList : [];

  const jobActionMutation = useMutation({
    mutationFn: ({ jobId, action }) => communicationsApi.bulkJobAction(jobId, action),
    onSuccess: (res) => {
      toast.success(res?.message || 'Job updated');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-bulk-jobs'] });
      if (selectedJob) {
        setSelectedJob(null);
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update job');
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'scheduled':
        return <Badge variant="info">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'paused':
        return <Badge variant="default">Paused</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scheduled Messages & Bulk Delivery Queue</h2>
          <p className="text-sm text-gray-500">
            Track automated broadcasts, scheduled message releases, and campaign delivery logs
          </p>
        </div>
        <Button variant="outline" onClick={() => bulkJobsQuery.refetch()} isLoading={bulkJobsQuery.isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Upcoming Scheduled</p>
              <p className="text-2xl font-bold text-indigo-600">
                {jobs.filter((j) => j.status === 'scheduled').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-indigo-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Completed Broadcasts</p>
              <p className="text-2xl font-bold text-emerald-600">
                {jobs.filter((j) => j.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Recipients Targeted</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(jobs.reduce((sum, j) => sum + (j.stats?.total || 0), 0))}
              </p>
            </div>
            <Users className="h-8 w-8 text-primary-400" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broadcasts & Queue Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Title</TableHead>
                  <TableHead>Audience / Reach</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled / Created</TableHead>
                  <TableHead>Delivery Stats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job._id || job.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{job.message_template || job.messageTemplate}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="capitalize text-xs font-medium text-gray-700">
                        {job.audience_type || job.audienceType}: {formatNumber(job.stats?.total || 0)} contacts
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(job.status)}</TableCell>

                    <TableCell className="text-xs text-gray-600">
                      {job.scheduled_at || job.scheduledAt ? (
                        <div className="flex items-center gap-1 text-indigo-700 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatSchedule(job.scheduled_at || job.scheduledAt)}</span>
                        </div>
                      ) : (
                        formatDate(job.created_at || job.createdAt)
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-700 font-semibold">{job.stats?.sent || 0} Sent</span>
                        {job.stats?.failed > 0 && <span className="text-red-600">({job.stats.failed} failed)</span>}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {job.status === 'scheduled' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => jobActionMutation.mutate({ jobId: job.id || job._id, action: 'run_now' })}
                              title="Run Immediately"
                            >
                              <Play className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Run Now
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => jobActionMutation.mutate({ jobId: job.id || job._id, action: 'cancel' })}
                              title="Cancel Scheduled Broadcast"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 text-center text-sm text-gray-500">
              No broadcast jobs or scheduled messages found. Create one in the Bulk Sender tab!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedJob && (
        <Modal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={`Job: ${selectedJob.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="mt-0.5">{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <span className="text-gray-500">Target Contacts:</span>
                <p className="mt-0.5 font-bold text-gray-900">{formatNumber(selectedJob.stats?.total || 0)}</p>
              </div>
              <div>
                <span className="text-gray-500">Safe Interval:</span>
                <p className="mt-0.5 font-bold text-gray-900">{selectedJob.batch_delay_seconds || 5} seconds</p>
              </div>
              <div>
                <span className="text-gray-500">Scheduled Delivery:</span>
                <p className="mt-0.5 font-bold text-gray-900">
                  {selectedJob.scheduled_at ? formatSchedule(selectedJob.scheduled_at) : 'Immediate'}
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-1">Message Template:</p>
              <div className="rounded-lg border border-gray-200 bg-white p-3 font-mono text-gray-800 whitespace-pre-wrap">
                {selectedJob.message_template || selectedJob.messageTemplate}
              </div>
            </div>

            {selectedJob.buttons?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-1">Interactive Buttons ({selectedJob.buttons.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.buttons.map((b, i) => (
                    <span key={i} className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-800 font-semibold">
                      🔘 {b.text} ({b.type})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedJob.recipients_summary?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  Recipient Dispatch Log (Showing first {selectedJob.recipients_summary.length}):
                </p>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Status / Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedJob.recipients_summary.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2 text-gray-600">{r.phone}</td>
                          <td className="p-2">
                            <span className={r.status === 'failed' || r.status === 'unknown' ? 'text-red-700 font-semibold capitalize' : 'text-gray-700 font-semibold capitalize'}>{r.status}</span>
                            {r.message_id && <p className="break-all text-[10px] text-gray-500">{r.message_id}</p>}
                            {r.error && <p className="mt-1 text-red-700">{typeof r.error === 'string' ? r.error : JSON.stringify(r.error)}</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedJob(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
