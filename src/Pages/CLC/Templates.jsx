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
import { normalizeAllowedModules } from '../../utils/moduleAccess.js';
import { formatDate, formatNumber, truncate } from '../../utils/format.js';

/* =========================
   CONSTANTS
========================= */
const statusOptions = ['active', 'at_risk', 'churned', 'loyal', 'new'];

const categoryOptions = [
  'rating_request',
  'feedback',
  'win_back',
  'loyalty',
  'complaint',
  'custom',
];

/* =========================
   FIXED NORMALIZER
========================= */
function normalizeCollection(payload) {
  return payload?.data || payload?.items || payload || [];
}

/* =========================
   HELPERS
========================= */
function templateVariant(channel) {
  if (channel === 'email') return 'info';
  if (channel === 'sms' || channel === 'whatsapp') return 'purple';
  return 'default';
}

function inferChannel(template) {
  return template.channel || 'whatsapp';
}

function getPreview(template) {
  if (template.subject) return template.subject;
  if (template.body) return template.body;
  if (template.content?.body) return template.content.body;
  return 'No preview available';
}

function getStatus(template) {
  if (template.status) return template.status;
  return template.isActive === false ? 'inactive' : 'active';
}

/* =========================
   COMPONENT
========================= */
export default function Templates() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const allowedModules = normalizeAllowedModules(user?.allowedModules);
  const canManageTemplates = allowedModules.includes('templates');

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

  /* =========================
     QUERIES (FIXED)
  ========================= */
  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll(),
  });

  const segmentsQuery = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentsApi.getAll(),
  });

  const templates = normalizeCollection(templatesQuery.data);
  const savedSegments = normalizeCollection(segmentsQuery.data);

  const emailCount = templates.filter((t) => inferChannel(t) === 'email').length;
  const messageCount = templates.filter((t) =>
    ['sms', 'whatsapp'].includes(inferChannel(t))
  ).length;

  /* =========================
     MUTATIONS (FIXED ERROR HANDLING)
  ========================= */
  const createTemplateMutation = useMutation({
    mutationFn: (payload) => templatesApi.create(payload),
    onSuccess: () => {
      toast.success('Template created');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => toast.error(error?.message || 'Failed to create template'),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, payload }) =>
      templatesApi.update(templateId, payload),
    onSuccess: () => {
      toast.success('Template updated');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => toast.error(error?.message || 'Failed to update template'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId) => templatesApi.delete(templateId),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => toast.error(error?.message || 'Failed to delete template'),
  });

  /* =========================
     HELPERS
  ========================= */
  const resetForm = () => {
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
  };

  const toggleMulti = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  /* =========================
     SUBMIT
  ========================= */
  const submitTemplate = (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Template name is required');
    if (!form.body.trim()) return toast.error('Template body is required');

    const payload = {
      name: form.name.trim(),
      category: form.category,
      whatsappTemplateName: form.whatsappTemplateName || undefined,
      content: {
        header: {
          type: form.headerType,
          text: form.headerType === 'text' ? form.headerText : undefined,
        },
        body: form.body.trim(),
        footer: form.footer || undefined,
      },
      targeting: {
        statuses: form.statuses,
        segments: form.segments,
        ...(form.minDaysSinceLastPurchase && {
          minDaysSinceLastPurchase: Number(form.minDaysSinceLastPurchase),
        }),
        ...(form.maxDaysSinceLastPurchase && {
          maxDaysSinceLastPurchase: Number(form.maxDaysSinceLastPurchase),
        }),
      },
      isActive: true,
    };

    if (editingTemplateId) {
      updateTemplateMutation.mutate({ templateId: editingTemplateId, payload });
    } else {
      createTemplateMutation.mutate(payload);
    }
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
      statuses: template.targeting?.statuses || [],
      segments: template.targeting?.segments || [],
      minDaysSinceLastPurchase: template.targeting?.minDaysSinceLastPurchase || '',
      maxDaysSinceLastPurchase: template.targeting?.maxDaysSinceLastPurchase || '',
    });

    setShowCreateModal(true);
  };

  /* =========================
     LOADING
  ========================= */
  if (templatesQuery.isLoading || segmentsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
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

            {canManageTemplates && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Library</CardTitle>
          </CardHeader>

          <CardContent>
            {templates.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template._id}>
                      <TableCell>{template.name}</TableCell>

                      <TableCell>
                        <Badge>
                          {template.category?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>

                      <TableCell>{getStatus(template)}</TableCell>

                      <TableCell>
                        {truncate(getPreview(template), 80)}
                      </TableCell>

                      <TableCell>
                        {formatDate(template.updatedAt || template.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {canManageTemplates ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500">
                No templates available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          if (createTemplateMutation.isPending || updateTemplateMutation.isPending) return;
          resetForm();
        }}
        title={editingTemplateId ? 'Edit Template' : 'Create Template'}
      >
        <form className="space-y-4" onSubmit={submitTemplate}>
          <Input
            label="Template Name *"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Select
            label="Category"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            options={categoryOptions.map((item) => ({
              label: item.replace(/_/g, ' '),
              value: item,
            }))}
          />

          <Input
            label="WhatsApp Template Name"
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Template Body *</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Input
            label="Footer"
            value={form.footer}
            onChange={(event) => setForm((prev) => ({ ...prev, footer: event.target.value }))}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Statuses</p>
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
            <p className="mb-2 text-sm font-medium text-gray-700">Lifecycle Segments</p>
            <div className="grid grid-cols-2 gap-2">
              {savedSegments.map((segment) => (
                <label key={segment._id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.segments.includes(segment._id)}
                    onChange={() => toggleMulti('segments', segment._id)}
                  />
                  <span>{segment.name}</span>
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
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
              {editingTemplateId ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
