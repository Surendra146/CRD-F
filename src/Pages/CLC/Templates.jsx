import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Edit, FileText, Mail, MessageSquareText, PlusCircle, Trash2 } from 'lucide-react';

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
import { segmentsApi } from '../../services/segments.js';
import { templatesApi } from '../../services/templates.js';
import { useAuthStore } from '../../store/authstore.js';
import { hasRoleAccess } from '../../utils/rbac.js';
import { formatDate, formatNumber, truncate } from '../../utils/format.js';

const statusOptions = ['active', 'at_risk', 'churned', 'loyal', 'new'];
const categoryOptions = [
  'rating_request',
  'feedback',
  'win_back',
  'loyalty',
  'complaint',
  'custom',
];

function normalizeCollection(payload) {
  return payload?.data?.data || payload?.data?.items || payload?.data || payload || [];
}

function templateVariant(channel) {
  if (channel === 'email') return 'info';
  if (channel === 'sms' || channel === 'whatsapp') return 'purple';
  return 'default';
}

function inferChannel(template) {
  if (template.channel) return template.channel;
  return 'whatsapp';
}

function getPreview(template) {
  if (typeof template.subject === 'string' && template.subject) return template.subject;
  if (typeof template.body === 'string' && template.body) return template.body;
  if (typeof template.content?.body === 'string' && template.content.body) return template.content.body;
  return 'No preview available';
}

function getStatus(template) {
  if (template.status) return template.status;
  return template.isActive === false ? 'inactive' : 'active';
}

export default function Templates() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManageTemplates = hasRoleAccess(user?.role, ['manager']);
  const canDeleteTemplates = hasRoleAccess(user?.role, ['admin']);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'custom',
    whatsappTemplateName: '',
    headerType: 'none',
    headerText: '',
    body: '',
    footer: '',
    statuses: [],
    segments: [],
    minDaysSinceLastPurchase: '',
    maxDaysSinceLastPurchase: '',
  });

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then(normalizeCollection),
  });

  const segmentsQuery = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.getAll().then(normalizeCollection),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload) => templatesApi.create(payload),
    onSuccess: () => {
      toast.success('Template created');
      setShowCreateModal(false);
      setEditingTemplateId(null);
      setForm({
        name: '',
        category: 'custom',
        whatsappTemplateName: '',
        headerType: 'none',
        headerText: '',
        body: '',
        footer: '',
        statuses: [],
        segments: [],
        minDaysSinceLastPurchase: '',
        maxDaysSinceLastPurchase: '',
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to create template'),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, payload }) => templatesApi.update(templateId, payload),
    onSuccess: () => {
      toast.success('Template updated');
      setShowCreateModal(false);
      setEditingTemplateId(null);
      setForm({
        name: '',
        category: 'custom',
        whatsappTemplateName: '',
        headerType: 'none',
        headerText: '',
        body: '',
        footer: '',
        statuses: [],
        segments: [],
        minDaysSinceLastPurchase: '',
        maxDaysSinceLastPurchase: '',
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to update template'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId) => templatesApi.delete(templateId),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to delete template'),
  });

  const templates = Array.isArray(templatesQuery.data) ? templatesQuery.data : [];
  const savedSegments = Array.isArray(segmentsQuery.data) ? segmentsQuery.data : [];
  const emailCount = templates.filter((template) => inferChannel(template) === 'email').length;
  const messageCount = templates.filter((template) => ['sms', 'whatsapp'].includes(inferChannel(template))).length;

  const toggleMulti = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));
  };

  const submitTemplate = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!form.body.trim()) {
      toast.error('Template body is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      whatsappTemplateName: form.whatsappTemplateName.trim() || undefined,
      content: {
        header: {
          type: form.headerType,
          text: form.headerType === 'text' ? form.headerText.trim() : undefined,
        },
        body: form.body.trim(),
        footer: form.footer.trim() || undefined,
      },
      targeting: {
        statuses: form.statuses,
        segments: form.segments,
        ...(form.minDaysSinceLastPurchase
          ? { minDaysSinceLastPurchase: Number(form.minDaysSinceLastPurchase) }
          : {}),
        ...(form.maxDaysSinceLastPurchase
          ? { maxDaysSinceLastPurchase: Number(form.maxDaysSinceLastPurchase) }
          : {}),
      },
      isActive: true,
    };

    if (editingTemplateId) {
      updateTemplateMutation.mutate({ templateId: editingTemplateId, payload });
      return;
    }

    createTemplateMutation.mutate(payload);
  };

  const openEditTemplate = (template) => {
    setEditingTemplateId(template._id);
    setForm({
      name: template.name || '',
      category: template.category || 'custom',
      whatsappTemplateName: template.whatsappTemplateName || '',
      headerType: template.content?.header?.type || 'none',
      headerText: template.content?.header?.text || '',
      body: template.content?.body || '',
      footer: template.content?.footer || '',
      statuses: Array.isArray(template.targeting?.statuses) ? template.targeting.statuses : [],
      segments: Array.isArray(template.targeting?.segments) ? template.targeting.segments : [],
      minDaysSinceLastPurchase:
        template.targeting?.minDaysSinceLastPurchase !== undefined
          ? String(template.targeting.minDaysSinceLastPurchase)
          : '',
      maxDaysSinceLastPurchase:
        template.targeting?.maxDaysSinceLastPurchase !== undefined
          ? String(template.targeting.maxDaysSinceLastPurchase)
          : '',
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = (template) => {
    if (!template?._id) return;
    const confirmed = window.confirm(`Delete template "${template.name}"?`);
    if (!confirmed) return;
    deleteTemplateMutation.mutate(template._id);
  };

  if (templatesQuery.isLoading || segmentsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Templates"
        subtitle="Create reusable WhatsApp messaging templates"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => templatesQuery.refetch()}>
              Refresh
            </Button>
            {canManageTemplates ? (
              <Button
                onClick={() => {
                  setEditingTemplateId(null);
                  setShowCreateModal(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">All Templates</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{formatNumber(templates.length)}</p>
              </div>
              <FileText className="h-6 w-6 text-gray-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Email Templates</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{formatNumber(emailCount)}</p>
              </div>
              <Mail className="h-6 w-6 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Messaging Templates</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{formatNumber(messageCount)}</p>
              </div>
              <MessageSquareText className="h-6 w-6 text-purple-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Saved Segments</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{formatNumber(savedSegments.length)}</p>
              </div>
              <FileText className="h-6 w-6 text-indigo-600" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Library</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {templatesQuery.isError ? (
              <div className="px-6 py-10 text-center text-red-500">Failed to load templates.</div>
            ) : templates.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template._id || template.id || template.name}>
                      <TableCell className="font-medium text-gray-900">
                        {template.name || 'Untitled template'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={templateVariant(inferChannel(template))}>
                          {(template.category || inferChannel(template)).replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{getStatus(template)}</TableCell>
                      <TableCell className="max-w-sm text-gray-600">
                        {truncate(getPreview(template), 80)}
                      </TableCell>
                      <TableCell>{formatDate(template.updatedAt || template.createdAt || new Date())}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {canManageTemplates ? (
                            <Button variant="ghost" size="sm" onClick={() => openEditTemplate(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canDeleteTemplates ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template)}
                              disabled={deleteTemplateMutation.isPending}
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
                No templates available yet. Create your first template.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          if (createTemplateMutation.isPending || updateTemplateMutation.isPending) return;
          setEditingTemplateId(null);
          setShowCreateModal(false);
        }}
        title={editingTemplateId ? 'Edit Template' : 'Create Template'}
      >
        <form className="space-y-4" onSubmit={submitTemplate}>
          <Input
            label="Template Name *"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              options={categoryOptions.map((value) => ({ label: value.replace(/_/g, ' '), value }))}
            />
            <Input
              label="WhatsApp Template Key"
              value={form.whatsappTemplateName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, whatsappTemplateName: event.target.value }))
              }
            />
            <Select
              label="Header Type"
              value={form.headerType}
              onChange={(event) => setForm((prev) => ({ ...prev, headerType: event.target.value }))}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Text', value: 'text' },
              ]}
            />
            {form.headerType === 'text' ? (
              <Input
                label="Header Text"
                value={form.headerText}
                onChange={(event) => setForm((prev) => ({ ...prev, headerText: event.target.value }))}
              />
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Body *</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-primary-300 focus:ring-2"
              placeholder="Hello {{name}}, we miss you at our store..."
            />
          </div>
          <Input
            label="Footer"
            value={form.footer}
            onChange={(event) => setForm((prev) => ({ ...prev, footer: event.target.value }))}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Target Statuses</p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.statuses.includes(status)}
                    onChange={() => toggleMulti('statuses', status)}
                  />
                  <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Saved Segment Names</p>
            <div className="grid grid-cols-2 gap-2">
              {savedSegments.length ? (
                savedSegments.map((segment) => (
                  <label key={segment._id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.segments.includes(segment.name)}
                      onChange={() => toggleMulti('segments', segment.name)}
                    />
                    <span>{segment.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No saved segments yet. Create one from Campaigns.</p>
              )}
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
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {editingTemplateId ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
