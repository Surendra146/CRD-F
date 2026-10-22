import TemplateParameters from './whatsapp/TemplateParameters.jsx';
import { formatApiError } from '../../config/apiContract.js';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Megaphone, PauseCircle, PlayCircle, PlusCircle } from 'lucide-react';

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
import { communicationsApi } from '../../services/communications.js';
import { templatePreview, isSupportedApprovedTemplate } from '../../utils/metaTemplates.js';
import { TemplateMediaPreview } from './Templates.jsx';
import { templatesApi } from '../../services/templates.js';
import { useAuthStore } from '../../store/authstore.js';
import { normalizeAllowedModules } from '../../utils/moduleAccess.js';
import { formatDate, formatNumber } from '../../utils/format.js';
import { campaignSchedule } from '../../config/apiContract.js';

function normalizeCollection(payload) {
  return payload?.data || payload?.items || payload || [];
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
  mediaAsset: '',
  templateMappings: {},
  audienceType: 'all',
  segmentId: '',
  statuses: [],
  segments: [],
  minDaysSinceLastPurchase: '',
  scheduleDate: '',
  scheduleTime: '',
};

export default function Campaigns() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const normalizedRole = String(user?.role || '').toLowerCase();
  const canManageCampaigns =
    normalizedRole !== 'viewer' && (['owner', 'admin'].includes(normalizedRole) ||
    normalizeAllowedModules(user?.allowedModules).includes('campaigns'));

  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const [campaignForm, setCampaignForm] = useState(initialCampaignForm);

  const campaignsQuery = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getAll(),
  });

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll(),
    enabled: ['owner', 'admin'].includes(normalizedRole) ||
      normalizeAllowedModules(user?.allowedModules).some((module) => ['templates', 'whatsapp'].includes(module)),
  });

  const segmentsQuery = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.getAll(),
  });

  const campaigns = normalizeCollection(campaignsQuery.data);
  const templates = normalizeCollection(templatesQuery.data);
  const savedSegments = normalizeCollection(segmentsQuery.data);

  const { statusOptions, lifecycleSegmentOptions } = useMemo(
    () => extractAudienceOptions(savedSegments, campaigns),
    [savedSegments, campaigns]
  );

  const configuration = useQuery({ queryKey: ['whatsapp-configuration'], queryFn: communicationsApi.configuration });
  const account = configuration.data?.data?.sender;
  const selectedTemplate = templates.find(t => String(t._id || t.id) === String(campaignForm.template));
  const approved = selectedTemplate?.workflow?.approved;
  const preview = templatePreview(approved, {}, campaignForm.templateMappings);
  const mediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(approved?.header_type);
  const externalScopes = (approved?.components || []).flatMap(p => p.type === 'BUTTONS' ? (p.buttons || []).flatMap((b, i) => (b.type === 'COPY_CODE' || (b.type === 'URL' && /\{\{/.test(b.url || ''))) ? [[`button_${i}`, 1]] : []) : ['HEADER', 'BODY'].includes(p.type) ? [[p.type.toLowerCase(), new Set((p.text || '').match(/\{\{\s*(?:[a-zA-Z_][\w.]*|[1-9]\d*)\s*\}\}/g) || []).size]] : []).filter(([scope, count]) => count && !approved?.parameters?.[scope]?.length);
  const templateOptions = templates.filter(t => isSupportedApprovedTemplate(t, account?.waba_id)).map((template) => ({
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

  const createCampaignMutation = useMutation({
    mutationFn: (payload) => campaignsApi.create(payload),
    onSuccess: () => {
      toast.success('Campaign created');
      setShowCampaignModal(false);
      resetCampaignForm();
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(formatApiError(error) || 'Failed to create campaign'),
  });

  const launchCampaignMutation = useMutation({
    mutationFn: (campaignId) => campaignsApi.launch(campaignId),
    onSuccess: () => {
      toast.success('Campaign launched');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(formatApiError(error) || 'Failed to launch campaign'),
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: (campaignId) => campaignsApi.pause(campaignId),
    onSuccess: () => {
      toast.success('Campaign paused');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(formatApiError(error) || 'Failed to pause campaign'),
  });

  const resumeCampaignMutation = useMutation({
    mutationFn: (campaignId) => campaignsApi.resume(campaignId),
    onSuccess: () => {
      toast.success('Campaign resumed');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(formatApiError(error) || 'Failed to resume campaign'),
  });

  const completeCampaignMutation = useMutation({
    mutationFn: (campaignId) => campaignsApi.complete(campaignId),
    onSuccess: () => {
      toast.success('Campaign completed');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => toast.error(formatApiError(error) || 'Failed to complete campaign'),
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

  const submitCampaign = (event) => {
    event.preventDefault();

    if (!campaignForm.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (mediaHeader && !campaignForm.mediaAsset) { toast.error('Select send-time media for this template'); return; }
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

    let schedule;
    try {
      schedule = campaignSchedule(campaignForm.scheduleDate, campaignForm.scheduleTime);
    } catch (error) {
      toast.error(error.message);
      return;
    }

    const payload = {
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim(),
      type: campaignForm.type,
      template: campaignForm.template,
      audience: {
        type: campaignForm.audienceType,
        filters,
        template_media_asset_id: campaignForm.mediaAsset || undefined,
        template_mappings: campaignForm.templateMappings,
      },
      ...(schedule ? { schedule } : {}),
    };

    createCampaignMutation.mutate(payload);
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
          <div className="flex flex-wrap items-center gap-2">
            {canManageCampaigns ? (
              <>
                <Button
                  onClick={() => {
                    resetCampaignForm();
                    setShowCampaignModal(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                      {(() => {
                        const isLaunching = launchCampaignMutation.isPending;
                        const isPausing = pauseCampaignMutation.isPending;
                        const isResuming = resumeCampaignMutation.isPending;
                        const isCompleting = completeCampaignMutation.isPending;
                        const disableActions =
                          isLaunching || isPausing || isResuming || isCompleting;
                        const isActive = ['active', 'running'].includes(campaign.status);
                        const canLaunch = ['draft', 'scheduled'].includes(campaign.status);
                        const canPause = isActive;
                        const canResume = campaign.status === 'paused';
                        const canComplete = isActive || campaign.status === 'paused';

                        return (
                          <>
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
                          {canManageCampaigns && canLaunch ? (
                            <Button
                              size="sm"
                              onClick={() => launchCampaignMutation.mutate(campaign._id)}
                              disabled={disableActions}
                            >
                              <PlayCircle className="mr-1 h-4 w-4" />
                              Launch
                            </Button>
                          ) : null}

                          {canManageCampaigns && canPause ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseCampaignMutation.mutate(campaign._id)}
                              disabled={disableActions}
                            >
                              <PauseCircle className="mr-1 h-4 w-4" />
                              Pause
                            </Button>
                          ) : null}

                          {canManageCampaigns && canResume ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resumeCampaignMutation.mutate(campaign._id)}
                              disabled={disableActions}
                            >
                              <PlayCircle className="mr-1 h-4 w-4" />
                              Resume
                            </Button>
                          ) : null}

                          {canManageCampaigns && canComplete ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeCampaignMutation.mutate(campaign._id)}
                              disabled={disableActions}
                            >
                              Complete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                          </>
                        );
                      })()}
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
                setCampaignForm((prev) => ({ ...prev, template: event.target.value, mediaAsset: '', templateMappings: {} }))
              }
              options={[{ label: 'Select template', value: '' }, ...templateOptions]}
            />
          </div>

          {!account && <p role="alert">{configuration.data?.data?.sender_error || 'Unable to resolve sender. Retry or check Settings.'}</p>}
          {approved && <div className="rounded-lg bg-emerald-50 p-4 space-y-2" aria-label="Approved template preview">
            {preview.header && <p className="font-semibold">{preview.header}</p>}
            {mediaHeader && <TemplateMediaPreview templateId={campaignForm.template} asset={selectedTemplate?.workflow?.assets?.find(a => a.id === campaignForm.mediaAsset)} />}
            <p className="whitespace-pre-wrap">{preview.body}</p>
            {preview.footer && <p className="text-xs text-gray-500">{preview.footer}</p>}
            {preview.buttons.map((button, index) => <div className="border-t py-2 text-center" key={index}>{button.text}</div>)}
          </div>}
          {mediaHeader && <div className="space-y-2 rounded-lg border p-3">
            <Select label={`Send-time ${approved.header_type.toLowerCase()} (shared asset)`} value={campaignForm.mediaAsset} onChange={e => setCampaignForm(prev => ({ ...prev, mediaAsset: e.target.value }))} options={[{ label: 'Select uploaded media', value: '' }, ...(selectedTemplate?.workflow?.assets || []).filter(a => a.type.toUpperCase() === approved.header_type).map(a => ({ label: a.name, value: a.id }))]} />
            <p className="text-xs text-gray-500">Upload or replace assets in Templates or Bulk Sender before creating this campaign.</p>
          </div>}
          <TemplateParameters scopes={externalScopes} mappings={campaignForm.templateMappings} onChange={templateMappings => setCampaignForm(prev => ({ ...prev, templateMappings }))} />
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
            <Button type="submit" disabled={!account} isLoading={createCampaignMutation.isPending}>
              Create Campaign
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
