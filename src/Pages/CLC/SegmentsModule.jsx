import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/Layout/Header.jsx';
import Badge from '../../components/UI/badge.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import Input from '../../components/UI/input.jsx';
import Loader from '../../components/UI/loader.jsx';
import Modal from '../../components/UI/modal.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/UI/table.jsx';
import { segmentsApi } from '../../services/segments.js';
import { formatDate } from '../../utils/format.js';

const lifecycleSegmentOptions = [
  'champions',
  'loyal_customers',
  'potential_loyalist',
  'new_customers',
  'promising',
  'need_attention',
  'about_to_sleep',
  'at_risk',
  'cant_lose',
  'hibernating',
  'lost',
];

const customerStatusOptions = ['active', 'at_risk', 'churned', 'loyal', 'new'];

const initialForm = {
  name: '',
  description: '',
  statuses: [],
  segments: [],
  minDaysSinceLastPurchase: '',
  maxDaysSinceLastPurchase: '',
  minTotalSpent: '',
  minOrders: '',
};

function labelize(value) {
  return String(value || '').replace(/_/g, ' ');
}

function normalizeCollection(payload) {
  return payload?.data || payload?.items || payload || [];
}

export default function SegmentsModule() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const segmentsQuery = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.getAll(),
  });

  const segments = normalizeCollection(segmentsQuery.data);

  const createMutation = useMutation({
    mutationFn: (payload) => segmentsApi.create(payload),
    onSuccess: () => {
      toast.success('Segment created');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      setShowModal(false);
      setEditingSegmentId(null);
      setForm(initialForm);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create segment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => segmentsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Segment updated');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      setShowModal(false);
      setEditingSegmentId(null);
      setForm(initialForm);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update segment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => segmentsApi.delete(id),
    onSuccess: () => {
      toast.success('Segment deleted');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete segment');
    },
  });

  const toggleArrayValue = (key, value) => {
    setForm((prev) => {
      const values = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  };

  const openCreate = () => {
    setEditingSegmentId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (segment) => {
    setEditingSegmentId(segment._id);
    setForm({
      name: segment.name || '',
      description: segment.description || '',
      statuses: Array.isArray(segment.filters?.statuses) ? segment.filters.statuses : [],
      segments: Array.isArray(segment.filters?.segments) ? segment.filters.segments : [],
      minDaysSinceLastPurchase:
        segment.filters?.minDaysSinceLastPurchase !== undefined
          ? String(segment.filters.minDaysSinceLastPurchase)
          : '',
      maxDaysSinceLastPurchase:
        segment.filters?.maxDaysSinceLastPurchase !== undefined
          ? String(segment.filters.maxDaysSinceLastPurchase)
          : '',
      minTotalSpent:
        segment.filters?.minTotalSpent !== undefined ? String(segment.filters.minTotalSpent) : '',
      minOrders: segment.filters?.minOrders !== undefined ? String(segment.filters.minOrders) : '',
    });
    setShowModal(true);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Segment name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      filters: {
        statuses: form.statuses,
        segments: form.segments,
        ...(form.minDaysSinceLastPurchase
          ? { minDaysSinceLastPurchase: Number(form.minDaysSinceLastPurchase) }
          : {}),
        ...(form.maxDaysSinceLastPurchase
          ? { maxDaysSinceLastPurchase: Number(form.maxDaysSinceLastPurchase) }
          : {}),
        ...(form.minTotalSpent ? { minTotalSpent: Number(form.minTotalSpent) } : {}),
        ...(form.minOrders ? { minOrders: Number(form.minOrders) } : {}),
      },
    };

    if (editingSegmentId) {
      updateMutation.mutate({ id: editingSegmentId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  if (segmentsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Create Segment Module"
        subtitle="Create and manage audience segments"
        actions={
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Saved Segments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {segmentsQuery.isError ? (
              <div className="px-6 py-10 text-center text-red-500">Failed to load segments.</div>
            ) : segments.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Filters</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment._id}>
                      <TableCell>
                        <p className="font-mono text-xs text-gray-700">{segment.code || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">{segment.name}</p>
                        <p className="text-sm text-gray-500">{segment.description || 'No description'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(segment.filters?.statuses || []).map((status) => (
                            <Badge key={`${segment._id}-status-${status}`}>{labelize(status)}</Badge>
                          ))}
                          {(segment.filters?.segments || []).map((item) => (
                            <Badge key={`${segment._id}-segment-${item}`} variant="info">
                              {labelize(item)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(segment.updatedAt || segment.createdAt || new Date())}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(segment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(segment._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-gray-500">No saved segments yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) return;
          setShowModal(false);
        }}
        title={editingSegmentId ? 'Edit Segment' : 'Create Segment'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Segment Name *"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Statuses</p>
            <div className="grid grid-cols-2 gap-2">
              {customerStatusOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.statuses.includes(option)}
                    onChange={() => toggleArrayValue('statuses', option)}
                  />
                  <span className="capitalize">{labelize(option)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Lifecycle Segments</p>
            <div className="grid grid-cols-2 gap-2">
              {lifecycleSegmentOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.segments.includes(option)}
                    onChange={() => toggleArrayValue('segments', option)}
                  />
                  <span className="capitalize">{labelize(option)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Min Days Since Last Purchase"
              type="number"
              value={form.minDaysSinceLastPurchase}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, minDaysSinceLastPurchase: event.target.value }))
              }
            />
            <Input
              label="Max Days Since Last Purchase"
              type="number"
              value={form.maxDaysSinceLastPurchase}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maxDaysSinceLastPurchase: event.target.value }))
              }
            />
            <Input
              label="Minimum Total Spend"
              type="number"
              value={form.minTotalSpent}
              onChange={(event) => setForm((prev) => ({ ...prev, minTotalSpent: event.target.value }))}
            />
            <Input
              label="Minimum Orders"
              type="number"
              value={form.minOrders}
              onChange={(event) => setForm((prev) => ({ ...prev, minOrders: event.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingSegmentId ? 'Update Segment' : 'Create Segment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
