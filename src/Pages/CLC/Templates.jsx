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
import { formatDate, truncate } from '../../utils/format.js';

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
  const normalizedRole = String(user?.role || '').toLowerCase();
  const canManageTemplates =
    ['owner', 'admin'].includes(normalizedRole) || allowedModules.includes('templates');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: 'custom',
    whatsappTemplateName: '',
    headerType: 'none',
    headerText: '',
    headerMediaUrl: '',
    body: '',
    footer: '',
    buttons: [],
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
      headerMediaUrl: '',
      body: '',
      footer: '',
      buttons: [],
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

  const addButton = (type = 'quick_reply') => {
    if (form.buttons.length >= 3) {
      toast.error('Maximum 3 interactive buttons allowed');
      return;
    }
    setForm((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        {
          id: `btn_${Date.now()}`,
          type,
          text: type === 'quick_reply' ? 'Quick Reply' : type === 'url' ? 'Visit Website' : 'Call Now',
          value: type === 'url' ? 'https://example.com' : type === 'phone_number' ? '+919876543210' : 'quick_reply',
        },
      ],
    }));
  };

  const removeButton = (index) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, idx) => idx !== index),
    }));
  };

  const updateButton = (index, field, val) => {
    setForm((prev) => {
      const next = [...prev.buttons];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, buttons: next };
    });
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
          mediaUrl: ['image', 'document', 'video'].includes(form.headerType) ? form.headerMediaUrl : undefined,
        },
        body: form.body.trim(),
        footer: form.footer || undefined,
        buttons: form.buttons || [],
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
      headerMediaUrl: template.content?.header?.mediaUrl || '',
      body: template.content?.body || '',
      footer: template.content?.footer || '',
      buttons: template.content?.buttons || [],
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => templatesQuery.refetch()}>
              Refresh
            </Button>

            {canManageTemplates && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New
              </Button>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                        <div className="flex flex-col gap-1">
                          <span>{truncate(getPreview(template), 70)}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {template.content?.header?.type && template.content.header.type !== 'none' && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 font-medium capitalize">
                                📎 {template.content.header.type}
                              </span>
                            )}
                            {template.content?.buttons?.length > 0 && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 font-medium">
                                🔘 {template.content.buttons.length} Buttons
                              </span>
                            )}
                          </div>
                        </div>
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
              { label: 'Image', value: 'image' },
              { label: 'Document (PDF)', value: 'document' },
              { label: 'Video', value: 'video' },
            ]}
          />

          {form.headerType === 'text' ? (
            <Input
              label="Header Text"
              value={form.headerText}
              onChange={(event) => setForm((prev) => ({ ...prev, headerText: event.target.value }))}
            />
          ) : null}

          {['image', 'document', 'video'].includes(form.headerType) ? (
            <Input
              label="Header Media URL"
              placeholder="https://example.com/media.jpg or document.pdf"
              value={form.headerMediaUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, headerMediaUrl: event.target.value }))}
            />
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Template Body *</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="Hi {{name}}, we have a special offer for you..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">Supports variables: &#123;&#123;name&#125;&#125;, &#123;&#123;phone&#125;&#125;, &#123;&#123;city&#125;&#125;, &#123;&#123;total_spent&#125;&#125;</p>
          </div>

          <Input
            label="Footer"
            value={form.footer}
            onChange={(event) => setForm((prev) => ({ ...prev, footer: event.target.value }))}
          />

          {/* Interactive Buttons (Feature 4: Add Button) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Interactive WhatsApp Buttons</p>
                <p className="text-xs text-gray-500">Add Quick Replies or Call-To-Action (URL/Phone) buttons</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => addButton('quick_reply')} disabled={form.buttons.length >= 3}>
                  + Quick Reply
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addButton('url')} disabled={form.buttons.length >= 3}>
                  + URL Button
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addButton('phone_number')} disabled={form.buttons.length >= 3}>
                  + Phone Button
                </Button>
              </div>
            </div>

            {form.buttons.length > 0 ? (
              <div className="space-y-2">
                {form.buttons.map((btn, idx) => (
                  <div key={btn.id || idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
                    <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 uppercase">
                      {btn.type.replace('_', ' ')}
                    </span>
                    <input
                      type="text"
                      className="min-w-0 flex-1 basis-40 rounded border border-gray-300 px-2 py-1 text-xs text-gray-800"
                      placeholder="Button Title"
                      value={btn.text}
                      onChange={(e) => updateButton(idx, 'text', e.target.value)}
                    />
                    {btn.type !== 'quick_reply' ? (
                      <input
                        type="text"
                        className="min-w-0 flex-1 basis-40 rounded border border-gray-300 px-2 py-1 text-xs text-gray-800"
                        placeholder={btn.type === 'url' ? 'https://example.com' : '+919876543210'}
                        value={btn.value}
                        onChange={(e) => updateButton(idx, 'value', e.target.value)}
                      />
                    ) : null}
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 text-xs px-2"
                      onClick={() => removeButton(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No buttons added yet. Up to 3 buttons allowed.</p>
            )}
          </div>

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
