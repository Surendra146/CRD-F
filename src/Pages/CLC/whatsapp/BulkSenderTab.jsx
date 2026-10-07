import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/card.jsx';
import Select from '../../../components/UI/select.jsx';
import Input from '../../../components/UI/input.jsx';
import Badge from '../../../components/UI/badge.jsx';
import { communicationsApi } from '../../../services/communications.js';
import InteractiveButtonsBuilder from './InteractiveButtonsBuilder.jsx';
import MediaAttachmentManager from './MediaAttachmentManager.jsx';
import SpintaxHelper from './SpintaxHelper.jsx';
import { resolveSpintaxClient } from '../../../utils/spintax.js';
import { formatNumber } from '../../../utils/format.js';

export default function BulkSenderTab({
  customers = [],
  templates = [],
  preloadedNumbers = [],
  audienceLoadError = false,
  onSwitchToScheduledQueue,
}) {
  const queryClient = useQueryClient();

  const [campaignTitle, setCampaignTitle] = useState(
    `Bulk Campaign - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  );
  const [audienceType, setAudienceType] = useState(preloadedNumbers.length > 0 ? 'custom_numbers' : 'segment');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [customNumbersInput, setCustomNumbersInput] = useState(
    preloadedNumbers.map((n) => (typeof n === 'string' ? n : n.formatted || n.phone)).join('\n')
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [metaTemplateName, setMetaTemplateName] = useState('');
  const [metaTemplateLanguage, setMetaTemplateLanguage] = useState('en_US');
  const [buttons, setButtons] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);

  // Sending & Throttling settings
  const [batchDelaySeconds, setBatchDelaySeconds] = useState(5);
  const [enableSpintax] = useState(true);

  // Scheduling options
  const [deliveryMode, setDeliveryMode] = useState('immediate'); // 'immediate' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Live preview recipient
  const [previewCustomerIndex, setPreviewCustomerIndex] = useState(0);

  // Audience calculation
  const audienceAudited = useMemo(() => {
    if (audienceType === 'all') {
      return customers.filter((c) => c.phone);
    }
    if (audienceType === 'segment') {
      if (!selectedSegment) return customers.filter((c) => c.phone);
      return customers.filter(
        (c) => c.phone && (c.lifecycle?.segment === selectedSegment || c.segment === selectedSegment)
      );
    }
    if (audienceType === 'custom_numbers') {
      const lines = customNumbersInput
        .split(/[\r\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return lines.map((num, i) => ({
        id: `custom_${i}`,
        name: `Contact ${i + 1}`,
        phone: num,
        demographics: { city: 'Local' },
        lifecycle: { totalSpent: 0, segment: 'custom' },
      }));
    }
    return [];
  }, [audienceType, selectedSegment, customers, customNumbersInput]);

  const targetRecipientCount = audienceAudited.length;

  const segmentOptions = useMemo(() => {
    const list = [
      { value: '', label: 'All Segments (Broadcast to all)' },
      ...[...new Set(customers.map((c) => c.lifecycle?.segment || c.segment).filter(Boolean))].map((segment) => ({
        value: segment,
        label: String(segment).replace(/_/g, ' '),
      })),
    ];
    return list;
  }, [customers]);

  const templateOptions = useMemo(() => {
    return [
      { value: '', label: 'Choose a template or write custom message' },
      ...templates.map((t) => ({
        value: t._id,
        label: t.name || t.whatsappTemplateName || 'Template',
      })),
    ];
  }, [templates]);

  const handleApplyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t._id === templateId);
    if (!tpl) return;

    if (tpl.content?.body) {
      setMessage(tpl.content.body);
    }
    if (tpl.content?.buttons?.length) {
      setButtons(tpl.content.buttons);
    }
    toast.success(`Template "${tpl.name}" loaded`);
  };

  const handleInsertToken = (token) => {
    setMessage((prev) => `${prev} ${token}`);
  };

  // Preview resolved message
  const previewRecipient = useMemo(() => audienceAudited[previewCustomerIndex] || audienceAudited[0] || {
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    demographics: { city: 'Hyderabad' },
    lifecycle: { totalSpent: 1250, segment: 'Loyal' },
  }, [audienceAudited, previewCustomerIndex]);

  const resolvedPreviewMessage = useMemo(() => {
    let text = message || 'Write your message above to see a live preview...';
    if (enableSpintax) {
      text = resolveSpintaxClient(text);
    }
    text = text
      .replace(/\{\{\s*name\s*\}\}/gi, previewRecipient.name || 'Customer')
      .replace(/\{\{\s*customer_name\s*\}\}/gi, previewRecipient.name || 'Customer')
      .replace(/\{\{\s*phone\s*\}\}/gi, previewRecipient.phone || '+91 98765 43210')
      .replace(/\{\{\s*city\s*\}\}/gi, previewRecipient.demographics?.city || 'your area')
      .replace(/\{\{\s*segment\s*\}\}/gi, previewRecipient.lifecycle?.segment || 'Valued')
      .replace(/\{\{\s*total_spent\s*\}\}/gi, `₹${previewRecipient.lifecycle?.totalSpent || 0}`);
    return text;
  }, [message, enableSpintax, previewRecipient]);

  // Bulk Send Mutation
  const bulkSendMutation = useMutation({
    mutationFn: (payload) => communicationsApi.sendBulkWhatsApp(payload),
    onSuccess: (res) => {
      if (res?.success === false || res?.data?.stats?.failed > 0) {
        toast.error(res?.message || 'Some messages failed. Check recipient errors in the queue.');
      } else {
        toast.success(res?.message || 'Meta accepted the broadcast; delivery is pending confirmation.');
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-bulk-jobs'] });
      if (deliveryMode === 'scheduled' && onSwitchToScheduledQueue) {
        onSwitchToScheduledQueue();
      }
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : detail?.provider_message || detail?.message || err?.message || 'Failed to dispatch bulk campaign');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!campaignTitle.trim()) {
      toast.error('Please enter a campaign title');
      return;
    }
    if (!message.trim() && !metaTemplateName.trim()) {
      toast.error('Please write a message template');
      return;
    }
    if (targetRecipientCount === 0) {
      toast.error('Target audience has 0 reachable recipients. Choose another segment or input numbers.');
      return;
    }
    if (targetRecipientCount > 20) {
      toast.error('Select up to 20 recipients per broadcast, or paste a smaller list in Custom Numbers.');
      return;
    }

    let scheduledAt = null;
    if (deliveryMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please pick both date and time for scheduled send');
        return;
      }
      const scheduled = new Date(`${scheduledDate}T${scheduledTime}`);
      if (!Number.isFinite(scheduled.getTime()) || scheduled <= new Date()) {
        toast.error('Scheduled date & time must be in the future');
        return;
      }
      scheduledAt = scheduled.toISOString();
    }

    const payload = {
      title: campaignTitle.trim(),
      audience_type: audienceType,
      audience: {
        segmentId: selectedSegment,
        numbers: audienceType === 'custom_numbers' ? audienceAudited.map((a) => a.phone) : undefined,
      },
      message: message.trim(),
      template: metaTemplateName.trim() ? { name: metaTemplateName.trim(), language: { code: metaTemplateLanguage.trim() } } : undefined,
      buttons,
      media_files: mediaFiles,
      batch_delay_seconds: Number(batchDelaySeconds),
      scheduled_at: scheduledAt,
    };

    bulkSendMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 via-white to-emerald-50 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary-600 p-2 text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">WhatsApp Broadcast Sender</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Send up to 20 recipients per immediate broadcast. Meta acceptance and delivery are tracked separately in the queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
            <p className="text-xs text-gray-500">Target Reach</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(targetRecipientCount)} Contacts</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 shadow-xs">
            <p className="text-xs text-emerald-700 font-medium">Dispatch interval</p>
            <p className="text-lg font-bold text-emerald-800">{batchDelaySeconds}s delay/msg</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column (2 Cols): Campaign Settings & Composer */}
        <div className="space-y-6 xl:col-span-2">
          {/* Campaign Details & Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-600" />
                1. Campaign Audience & Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Campaign Title *"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. Diwali Mega Sale Offer"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Target Audience Source *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAudienceType('segment')}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-center transition-all ${
                        audienceType === 'segment'
                          ? 'border-primary-600 bg-primary-50 text-primary-800 font-semibold'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Customer Segment
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudienceType('all')}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-center transition-all ${
                        audienceType === 'all'
                          ? 'border-primary-600 bg-primary-50 text-primary-800 font-semibold'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Customers ({customers.filter((c) => c.phone).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudienceType('custom_numbers')}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-center transition-all ${
                        audienceType === 'custom_numbers'
                          ? 'border-primary-600 bg-primary-50 text-primary-800 font-semibold'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Custom Numbers
                    </button>
                  </div>
                </div>

                {audienceType === 'segment' && (
                  <Select
                    label="Select Customer Segment"
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    options={segmentOptions}
                  />
                )}

                {audienceType === 'custom_numbers' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Paste Mobile Numbers (1 per line or comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      value={customNumbersInput}
                      onChange={(e) => setCustomNumbersInput(e.target.value)}
                      placeholder="+919876543210&#10;+919123456789"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>

              {/* Anti-Ban & Rate Limiter Configuration */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-700" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Dispatch interval</p>
                      <p className="text-[11px] text-amber-800">
                        Waits between requests. Meta messaging rules and account limits still apply.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-amber-900">Delay:</label>
                    <select
                      value={batchDelaySeconds}
                      onChange={(e) => setBatchDelaySeconds(Number(e.target.value))}
                      className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800"
                    >
                      <option value={3}>3 seconds (Fast)</option>
                      <option value={5}>5 seconds (Recommended)</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Composer & Personalization */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  2. Message Content & Personalization
                </CardTitle>
                <div className="w-64">
                  <Select
                    value={selectedTemplateId}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    options={templateOptions}
                    placeholder="Load from Template..."
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p>Custom text requires the recipient to have messaged your business within the last 24 hours. Otherwise use an approved Meta template. A saved CRM message is not a Meta-approved template.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>Approved Meta template name (optional)
                    <Input value={metaTemplateName} onChange={(e) => setMetaTemplateName(e.target.value)} placeholder="hello_world" />
                  </label>
                  <label>Exact template language code
                    <Input value={metaTemplateLanguage} onChange={(e) => setMetaTemplateLanguage(e.target.value)} placeholder="en_US" />
                  </label>
                </div>
                <p className="mt-2 text-xs">Use a template with no dynamic parameters here. Leave the name empty to send the custom text below. Meta controls the template content.</p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Message Body</label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi {{name}}, {we have a special deal|check out our exclusive discount} on your next order! Visit our store or reply to claim."
                  className="w-full rounded-xl border border-gray-300 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Personalization Tags & Spintax Assistant */}
              <SpintaxHelper
                message={message}
                onInsertToken={handleInsertToken}
                onApplyVariation={(v) => setMessage(v)}
              />

              {/* Interactive Buttons (Feature 4: Add Button) */}
              <InteractiveButtonsBuilder buttons={buttons} onChange={setButtons} />

              {/* Multiple Media Attachments (Feature 8: Send multiple files) */}
              <MediaAttachmentManager mediaFiles={mediaFiles} onChange={setMediaFiles} />
            </CardContent>
          </Card>

          {/* Scheduling & Execution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                3. Dispatch Schedule (Schedule Messages)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  onClick={() => setDeliveryMode('immediate')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                    deliveryMode === 'immediate'
                      ? 'border-primary-600 bg-primary-50/50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === 'immediate'}
                    onChange={() => setDeliveryMode('immediate')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Send className="h-4 w-4 text-primary-600" /> Send Immediately
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submits to Meta now. Delivery confirmation arrives separately.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                    deliveryMode === 'scheduled'
                      ? 'border-primary-600 bg-primary-50/50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === 'scheduled'}
                    onChange={() => setDeliveryMode('scheduled')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-indigo-600" /> Schedule for Later
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Automatically submits to Meta at your chosen date and time.
                    </p>
                  </div>
                </label>
              </div>

              {deliveryMode === 'scheduled' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Scheduled Date *</label>
                    <input
                      type="date"
                      min={new Date().toLocaleDateString('en-CA')}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Scheduled Time *</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>
              )}

              {deliveryMode === 'scheduled' && (
                <p className="text-xs text-gray-500">Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. The backend must be running to dispatch scheduled messages.</p>
              )}
              {audienceLoadError && audienceType !== 'custom_numbers' && (
                <p role="alert" className="text-sm text-red-600">Customers could not be loaded. Refresh Data or use Custom Numbers.</p>
              )}
              {targetRecipientCount === 0 && (
                <p role="status" className="text-sm text-amber-700">No recipients selected. Choose customers above or paste phone numbers under Custom Numbers.</p>
              )}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={bulkSendMutation.isPending}
                >
                  {deliveryMode === 'scheduled' ? (
                    <>
                      <Calendar className="mr-2 h-5 w-5" /> Schedule Bulk Campaign ({formatNumber(targetRecipientCount)})
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" /> Launch Bulk Broadcast ({formatNumber(targetRecipientCount)})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Live WhatsApp Bubble Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Live WhatsApp Message Preview</CardTitle>
                {audienceAudited.length > 1 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <button
                      type="button"
                      disabled={previewCustomerIndex <= 0}
                      onClick={() => setPreviewCustomerIndex((p) => Math.max(0, p - 1))}
                      className="rounded border border-gray-200 px-1.5 py-0.5 hover:bg-gray-100 disabled:opacity-40"
                    >
                      ←
                    </button>
                    <span>
                      {previewCustomerIndex + 1}/{audienceAudited.length}
                    </span>
                    <button
                      type="button"
                      disabled={previewCustomerIndex >= audienceAudited.length - 1}
                      onClick={() => setPreviewCustomerIndex((p) => Math.min(audienceAudited.length - 1, p + 1))}
                      className="rounded border border-gray-200 px-1.5 py-0.5 hover:bg-gray-100 disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* WhatsApp Chat Container */}
              <div className="rounded-2xl border border-gray-200 bg-[#E5DDD5] p-4 shadow-inner min-h-[380px] flex flex-col justify-end">
                {/* Chat Bubble */}
                <div className="max-w-[90%] self-end rounded-2xl rounded-tr-xs bg-[#E7FFDB] p-3.5 shadow-sm text-gray-900 space-y-2 border border-[#d2f3c0]">
                  {/* Media Previews inside bubble */}
                  {mediaFiles.length > 0 && (
                    <div className="rounded-lg bg-white/70 p-2 space-y-1.5 border border-emerald-200/50">
                      <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                        📎 {mediaFiles.length} Attachment{mediaFiles.length > 1 ? 's' : ''}:
                      </p>
                      {mediaFiles.map((m, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-800 truncate">
                          <span className="font-semibold text-emerald-700">[{m.type}]:</span>
                          <span className="truncate">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Body Text */}
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
                    {resolvedPreviewMessage}
                  </p>

                  <div className="flex justify-end items-center gap-1 text-[10px] text-gray-500">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>

                  {/* Interactive Buttons rendered in WhatsApp style */}
                  {buttons.length > 0 && (
                    <div className="pt-1.5 border-t border-emerald-200/80 space-y-1">
                      {buttons.map((btn, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-white py-1.5 px-3 text-center text-xs font-semibold text-[#00A884] shadow-xs border border-gray-200 flex items-center justify-center gap-1.5 hover:bg-gray-50 cursor-pointer"
                        >
                          {btn.type === 'url' && <span className="text-[10px]">🔗</span>}
                          {btn.type === 'phone_number' && <span className="text-[10px]">📞</span>}
                          {btn.type === 'quick_reply' && <span className="text-[10px]">💬</span>}
                          <span>{btn.text || 'Button'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs space-y-1">
                <p className="font-semibold text-gray-900">Current Recipient Preview:</p>
                <div className="flex justify-between text-gray-600">
                  <span>Name:</span>
                  <span className="font-medium text-gray-900">{previewRecipient.name}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phone:</span>
                  <span className="font-medium text-gray-900">{previewRecipient.phone}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Segment:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {previewRecipient.lifecycle?.segment || 'General'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
