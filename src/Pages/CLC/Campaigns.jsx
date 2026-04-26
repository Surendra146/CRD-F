import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Edit, Megaphone, PauseCircle, PlayCircle, PlusCircle, Trash2 } from 'lucide-react';

import Header from '../../components/Layout/Header.jsx';
import Badge from '../../components/UI/badge.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import Input from '../../components/UI/input.jsx';
import Loader from '../../components/UI/loader.jsx';
import Modal from '../../components/UI/modal.jsx';
import Select from '../../components/UI/select.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/UI/table.jsx';
import { campaignsApi } from '../../services/campaigns.js';
import { segmentsApi } from '../../services/segments.js';
import { templatesApi } from '../../services/templates.js';
import { useAuthStore } from '../../store/authstore.js';
import { hasRoleAccess } from '../../utils/rbac.js';
import { formatDate, formatNumber } from '../../utils/format.js';

function normalizeCollection(payload) {
  return payload?.data?.data || payload?.data?.items || payload?.data || payload || [];
}

function normalizeOptionLabel(value) {
  return String(value || '').replace(/_/g, ' ');
}

function getUniqueOptions(values = []) {
  return [...new Set(values.filter(Boolean))]
    .sort()
    .map((value) => ({
      label: normalizeOptionLabel(value),
      value,
    }));
}

function extractAudienceOptions(savedSegments = [], campaigns = []) {
  const statuses = [];
  const lifecycleSegments = [];

  savedSegments.forEach((segment) => {
    statuses.push(...(segment.filters?.statuses || []));
    lifecycleSegments.push(...(segment.filters?.segments || []));
  });

  campaigns.forEach((campaign) => {
    statuses.push(...(campaign.audience?.filters?.statuses || []));
    lifecycleSegments.push(...(campaign.audience?.filters?.segments || []));
  });

  return {
    statusOptions: getUniqueOptions(statuses),
    lifecycleSegmentOptions: getUniqueOptions(lifecycleSegments),
  };
}

function getCampaignVariant(status) {
  if (status === 'running' || status === 'active' || status === 'launched') return 'success';
  if (status === 'paused') return 'warning';
  if (status === 'draft') return 'default';
  return 'info';
}

function formatAudience(audience) {
  if (!audience) return 'Not set';
  if (typeof audience === 'string') return audience;
  if (audience.type === 'all') return 'All customers';
  if (audience.type === 'custom') return `${audience.customerIds?.length || 0} selected customers`;

  if (audience.type === 'segment') {
    const segments = audience.filters?.segments?.join(', ');
    const statuses = audience.filters?.statuses?.join(', ');
    return segments || statuses || 'Segment audience';
  }

  return audience.type || 'Configured audience';
}

const initialCampaignForm = {
  name: '',
  description: '',
  type: 'one_time',
  template: '',
  audienceType: 'all',
  segmentId: '',
  statuses: [],
  segments: [],
  minDaysSinceLastPurchase: '',
  scheduleDate: '',
  scheduleTime: '',
};

const initialSegmentForm = {
  name: '',
  description: '',
  statuses: [],
  segments: [],
  minDaysSinceLastPurchase: '',
  maxDaysSinceLastPurchase: '',
  minTotalSpent: '',
  minOrders: '',
};

export default function Campaigns() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const canManageCampaigns = hasRoleAccess(user?.role, ['manager']);
  const canDeleteSegments = hasRoleAccess(user?.role, ['admin']);

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState(null);

  const [campaignForm, setCampaignForm] = useState(initialCampaignForm);
  const [segmentForm, setSegmentForm] = useState(initialSegmentForm);

  const campaignsQuery = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getAll().then(normalizeCollection),
  });

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then(normalizeCollection),
  });

  const segmentsQuery = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.getAll().then(normalizeCollection),
  });

  const campaigns = Array.isArray(campaignsQuery.data) ? campaignsQuery.data : [];
  const templates = Array.isArray(templatesQuery.data) ? templatesQuery.data : [];
  const savedSegments = Array.isArray(segmentsQuery.data) ? segmentsQuery.data : [];

  const { statusOptions, lifecycleSegmentOptions } = useMemo(
    () => extractAudienceOptions(savedSegments, campaigns),
    [savedSegments, campaigns]
  );

  const templateOptions = templates.map((template) => ({
    label: `${template.name} (${template.category || 'custom'})`,
    value: template._id,
  }));

  const activeCount = campaigns.filter((campaign) =>
    ['running', 'active', 'launched'].includes(campaign.status)
  ).length;

  const pausedCount = campaigns.filter((campaign) => campaign.status === 'paused').length;

  const resetCampaignForm = () => {
    setCampaignForm(initialCampaignForm);
  };

  const resetSegmentForm = () => {
    setSegmentForm(initialSegmentForm);
  };

  const createCampaignMutation = useMutation({
    mutationFn: (payload) => campaignsApi.create(payload),
    onSuccess: () => {
      toast.success('Campaign created');
      setShowCampaignModal(false);
      resetCampaignForm();
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to create campaign'),
  });

  const createSegmentMutation = useMutation({
    mutationFn: (payload) => segmentsApi.create(payload),
    onSuccess: () => {
      toast.success('Segment created');
      setEditingSegmentId(null);
      setShowSegmentModal(false);
      resetSegmentForm();
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to create segment'),
  });

  const updateSegmentMutation = useMutation({
    mutationFn: ({ segmentId, payload }) => segmentsApi.update(segmentId, payload),
    onSuccess: () => {
      toast.success('Segment updated');
      setEditingSegmentId(null);
      setShowSegmentModal(false);
      resetSegmentForm();
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to update segment'),
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: (segmentId) => segmentsApi.delete(segmentId),
    onSuccess: () => {
      toast.success('Segment deleted');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to delete segment'),
  });

  const launchCampaignMutation = useMutation({
    mutationFn: (campaignId) => campaignsApi.launch(campaignId),
    onSuccess: () => {
      toast.success('Campaign launched');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to launch campaign'),
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: (campaignId) => campaignsApi.pause(campaignId),
    onSuccess: () => {
      toast.success('Campaign paused');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to pause campaign'),
  });

  const toggleCampaignMulti = (key, value) => {
    setCampaignForm((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];

      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const toggleSegmentMulti = (key, value) => {
    setSegmentForm((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];

      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const submitCampaign = (event) => {
    event.preventDefault();

    if (!campaignForm.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!campaignForm.template) {
      toast.error('Please choose a template');
      return;
    }

    let filters = {};

    if (campaignForm.audienceType === 'segment') {
      if (campaignForm.segmentId) {
        const selected = savedSegments.find((segment) => segment._id === campaignForm.segmentId);
        filters = { ...(selected?.filters || {}) };
      } else {
        filters = {
          statuses: campaignForm.statuses,
          segments: campaignForm.segments,
          ...(campaignForm.minDaysSinceLastPurchase
            ? { minDaysSinceLastPurchase: Number(campaignForm.minDaysSinceLastPurchase) }
            : {}),
        };
      }

      if (!filters.statuses?.length && !filters.segments?.length && !filters.minDaysSinceLastPurchase) {
        toast.error('Choose segment filters or select a saved segment');
        return;
      }
    }

    const payload = {
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim(),
      type: campaignForm.type,
      template: campaignForm.template,
      audience: {
        type: campaignForm.audienceType,
        filters,
      },
      ...(campaignForm.scheduleDate || campaignForm.scheduleTime
        ? {
            schedule: {
              ...(campaignForm.scheduleDate ? { startDate: campaignForm.scheduleDate } : {}),
              ...(campaignForm.scheduleTime ? { sendTime: campaignForm.scheduleTime } : {}),
              timezone: 'Asia/Kolkata',
            },
          }
        : {}),
    };

    createCampaignMutation.mutate(payload);
  };

  const submitSegment = (event) => {
    event.preventDefault();

    if (!segmentForm.name.trim()) {
      toast.error('Segment name is required');
      return;
    }

    const payload = {
      name: segmentForm.name.trim(),
      description: segmentForm.description.trim(),
      filters: {
        statuses: segmentForm.statuses,
        segments: segmentForm.segments,
        ...(segmentForm.minDaysSinceLastPurchase
          ? { minDaysSinceLastPurchase: Number(segmentForm.minDaysSinceLastPurchase) }
          : {}),
        ...(segmentForm.maxDaysSinceLastPurchase
          ? { maxDaysSinceLastPurchase: Number(segmentForm.maxDaysSinceLastPurchase) }
          : {}),
        ...(segmentForm.minTotalSpent ? { minTotalSpent: Number(segmentForm.minTotalSpent) } : {}),
        ...(segmentForm.minOrders ? { minOrders: Number(segmentForm.minOrders) } : {}),
      },
    };

    if (editingSegmentId) {
      updateSegmentMutation.mutate({ segmentId: editingSegmentId, payload });
      return;
    }

    createSegmentMutation.mutate(payload);
  };

  const openSegmentEdit = (segment) => {
    setEditingSegmentId(segment._id);

    setSegmentForm({
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

    setShowSegmentModal(true);
  };

  const handleSegmentDelete = (segment) => {
    if (!segment?._id) return;

    const confirmed = window.confirm(`Delete segment "${segment.name}"?`);
    if (!confirmed) return;

    deleteSegmentMutation.mutate(segment._id);
  };

  if (campaignsQuery.isLoading || templatesQuery.isLoading || segmentsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Campaigns"
        subtitle="Create, target, and track outbound campaigns"
        actions={
          <div className="flex items-center gap-2">
            {canManageCampaigns ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingSegmentId(null);
                    resetSegmentForm();
                    setShowSegmentModal(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Segment
                </Button>

                <Button
                  onClick={() => {
                    resetCampaignForm();
                    setShowCampaignModal(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Total Campaigns</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(campaigns.length)}
                </p>
              </div>
              <Megaphone className="h-6 w-6 text-gray-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(activeCount)}
                </p>
              </div>
              <PlayCircle className="h-6 w-6 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Paused</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(pausedCount)}
                </p>
              </div>
              <PauseCircle className="h-6 w-6 text-yellow-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Saved Segments</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(savedSegments.length)}
                </p>
              </div>
              <Megaphone className="h-6 w-6 text-indigo-600" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign List</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {campaignsQuery.isError ? (
              <div className="px-6 py-10 text-center text-red-500">Failed to load campaigns.</div>
            ) : campaigns.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign._id || campaign.id || campaign.name}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {campaign.name || 'Untitled campaign'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {campaign.description || 'No description'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getCampaignVariant(campaign.status)}>
                          {(campaign.status || 'unknown').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {campaign.audienceName || formatAudience(campaign.audience) || 'Not set'}
                      </TableCell>

                      <TableCell>{campaign.template?.name || 'Not linked'}</TableCell>

                      <TableCell>{formatDate(campaign.updatedAt || campaign.createdAt || new Date())}</TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {canManageCampaigns && ['draft', 'scheduled', 'paused'].includes(campaign.status) ? (
                            <Button
                              size="sm"
                              onClick={() => launchCampaignMutation.mutate(campaign._id)}
                              disabled={launchCampaignMutation.isPending || pauseCampaignMutation.isPending}
                            >
                              <PlayCircle className="mr-1 h-4 w-4" />
                              Launch
                            </Button>
                          ) : null}

                          {canManageCampaigns && campaign.status === 'running' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseCampaignMutation.mutate(campaign._id)}
                              disabled={launchCampaignMutation.isPending || pauseCampaignMutation.isPending}
                            >
                              <PauseCircle className="mr-1 h-4 w-4" />
                              Pause
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No campaigns found yet. Create your first campaign.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Segments</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {segmentsQuery.isError ? (
              <div className="px-6 py-10 text-center text-red-500">Failed to load segments.</div>
            ) : savedSegments.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Filters</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {savedSegments.map((segment) => (
                    <TableRow key={segment._id}>
                      <TableCell>
                        <p className="font-medium text-gray-900">{segment.name}</p>
                        <p className="text-sm text-gray-500">{segment.description || 'No description'}</p>
                      </TableCell>

                      <TableCell className="text-sm text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {(segment.filters?.statuses || []).map((status) => (
                            <Badge key={`${segment._id}-status-${status}`} variant="default">
                              {normalizeOptionLabel(status)}
                            </Badge>
                          ))}

                          {(segment.filters?.segments || []).map((item) => (
                            <Badge key={`${segment._id}-segment-${item}`} variant="info">
                              {normalizeOptionLabel(item)}
                            </Badge>
                          ))}

                          {segment.filters?.minDaysSinceLastPurchase ? (
                            <Badge variant="warning">
                              {`>= ${segment.filters.minDaysSinceLastPurchase} days`}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>{formatDate(segment.updatedAt || segment.createdAt || new Date())}</TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {canManageCampaigns ? (
                            <Button variant="ghost" size="sm" onClick={() => openSegmentEdit(segment)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : null}

                          {canDeleteSegments ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSegmentDelete(segment)}
                              disabled={deleteSegmentMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No saved segments yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showCampaignModal}
        onClose={() => {
          if (createCampaignMutation.isPending) return;
          setShowCampaignModal(false);
        }}
        title="Create Campaign"
      >
        <form className="space-y-4" onSubmit={submitCampaign}>
          <Input
            label="Campaign Name *"
            value={campaignForm.name}
            onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Input
            label="Description"
            value={campaignForm.description}
            onChange={(event) =>
              setCampaignForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Campaign Type"
              value={campaignForm.type}
              onChange={(event) => setCampaignForm((prev) => ({ ...prev, type: event.target.value }))}
              options={[
                { label: 'One-time', value: 'one_time' },
                { label: 'Automated', value: 'automated' },
                { label: 'Recurring', value: 'recurring' },
              ]}
            />

            <Select
              label="Template *"
              value={campaignForm.template}
              onChange={(event) =>
                setCampaignForm((prev) => ({ ...prev, template: event.target.value }))
              }
              options={[{ label: 'Select template', value: '' }, ...templateOptions]}
            />
          </div>

          <Select
            label="Audience Type"
            value={campaignForm.audienceType}
            onChange={(event) =>
              setCampaignForm((prev) => ({ ...prev, audienceType: event.target.value }))
            }
            options={[
              { label: 'All customers', value: 'all' },
              { label: 'Segment-based', value: 'segment' },
            ]}
          />

          {campaignForm.audienceType === 'segment' ? (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              <Select
                label="Saved Segment (Optional)"
                value={campaignForm.segmentId}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, segmentId: event.target.value }))
                }
                options={[
                  { label: 'Use manual filters', value: '' },
                  ...savedSegments.map((segment) => ({ label: segment.name, value: segment._id })),
                ]}
              />

              {!campaignForm.segmentId ? (
                <>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Statuses</p>

                    {statusOptions.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={campaignForm.statuses.includes(option.value)}
                              onChange={() => toggleCampaignMulti('statuses', option.value)}
                            />
                            <span className="capitalize">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No status options found. Create/import customer data or use a saved segment.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Lifecycle Segments</p>

                    {lifecycleSegmentOptions.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {lifecycleSegmentOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={campaignForm.segments.includes(option.value)}
                              onChange={() => toggleCampaignMulti('segments', option.value)}
                            />
                            <span className="capitalize">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No lifecycle segment options found. Create/import customer data or use a saved segment.
                      </p>
                    )}
                  </div>

                  <Input
                    label="Minimum Days Since Last Purchase"
                    type="number"
                    value={campaignForm.minDaysSinceLastPurchase}
                    onChange={(event) =>
                      setCampaignForm((prev) => ({
                        ...prev,
                        minDaysSinceLastPurchase: event.target.value,
                      }))
                    }
                  />
                </>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={campaignForm.scheduleDate}
              onChange={(event) =>
                setCampaignForm((prev) => ({ ...prev, scheduleDate: event.target.value }))
              }
            />

            <Input
              label="Send Time"
              type="time"
              value={campaignForm.scheduleTime}
              onChange={(event) =>
                setCampaignForm((prev) => ({ ...prev, scheduleTime: event.target.value }))
              }
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={createCampaignMutation.isPending}>
              Create Campaign
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSegmentModal}
        onClose={() => {
          if (createSegmentMutation.isPending || updateSegmentMutation.isPending) return;
          setEditingSegmentId(null);
          setShowSegmentModal(false);
        }}
        title={editingSegmentId ? 'Edit Audience Segment' : 'Create Audience Segment'}
      >
        <form className="space-y-4" onSubmit={submitSegment}>
          <Input
            label="Segment Name *"
            value={segmentForm.name}
            onChange={(event) => setSegmentForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Input
            label="Description"
            value={segmentForm.description}
            onChange={(event) =>
              setSegmentForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Statuses</p>

            {statusOptions.length ? (
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={segmentForm.statuses.includes(option.value)}
                      onChange={() => toggleSegmentMulti('statuses', option.value)}
                    />
                    <span className="capitalize">{option.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No status options found from existing campaigns or segments.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Lifecycle Segments</p>

            {lifecycleSegmentOptions.length ? (
              <div className="grid grid-cols-2 gap-2">
                {lifecycleSegmentOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={segmentForm.segments.includes(option.value)}
                      onChange={() => toggleSegmentMulti('segments', option.value)}
                    />
                    <span className="capitalize">{option.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No lifecycle segment options found from existing campaigns or segments.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Min Days Since Last Purchase"
              type="number"
              value={segmentForm.minDaysSinceLastPurchase}
              onChange={(event) =>
                setSegmentForm((prev) => ({
                  ...prev,
                  minDaysSinceLastPurchase: event.target.value,
                }))
              }
            />

            <Input
              label="Max Days Since Last Purchase"
              type="number"
              value={segmentForm.maxDaysSinceLastPurchase}
              onChange={(event) =>
                setSegmentForm((prev) => ({
                  ...prev,
                  maxDaysSinceLastPurchase: event.target.value,
                }))
              }
            />

            <Input
              label="Minimum Total Spend"
              type="number"
              value={segmentForm.minTotalSpent}
              onChange={(event) =>
                setSegmentForm((prev) => ({ ...prev, minTotalSpent: event.target.value }))
              }
            />

            <Input
              label="Minimum Orders"
              type="number"
              value={segmentForm.minOrders}
              onChange={(event) =>
                setSegmentForm((prev) => ({ ...prev, minOrders: event.target.value }))
              }
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={createSegmentMutation.isPending || updateSegmentMutation.isPending}
            >
              {editingSegmentId ? 'Update Segment' : 'Create Segment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}