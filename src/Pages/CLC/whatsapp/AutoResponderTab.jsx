import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  Trash2,
  Edit,
  Play,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/UI/button.jsx';
import Badge from '../../../components/UI/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/card.jsx';
import Input from '../../../components/UI/input.jsx';
import Select from '../../../components/UI/select.jsx';
import Modal from '../../../components/UI/modal.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/UI/table.jsx';
import { marketingToolsApi } from '../../../services/marketingTools.js';
import InteractiveButtonsBuilder from './InteractiveButtonsBuilder.jsx';
import MediaAttachmentManager from './MediaAttachmentManager.jsx';

export default function AutoResponderTab() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('contains');
  const [keywordsText, setKeywordsText] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isActive, setIsActive] = useState(true);

  // Simulator State
  const [simMessage, setSimMessage] = useState('price of products?');
  const [simResult, setSimResult] = useState(null);

  // Fetch Rules Query
  const rulesQuery = useQuery({
    queryKey: ['auto-responder-rules'],
    queryFn: () => marketingToolsApi.getAutoResponderRules(),
  });

  const rawRules = rulesQuery.data?.data || rulesQuery.data || [];
  const rules = Array.isArray(rawRules) ? rawRules : [];

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.createAutoResponderRule(data),
    onSuccess: () => {
      toast.success('Auto-responder rule created');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['auto-responder-rules'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to create rule'),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => marketingToolsApi.updateAutoResponderRule(id, data),
    onSuccess: () => {
      toast.success('Auto-responder rule updated');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['auto-responder-rules'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to update rule'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => marketingToolsApi.deleteAutoResponderRule(id),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: ['auto-responder-rules'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete rule'),
  });

  const testMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.testAutoResponder(data),
    onSuccess: (res) => {
      setSimResult(res?.data || null);
    },
    onError: (err) => toast.error('Simulation failed'),
  });

  const resetForm = () => {
    setName('');
    setTriggerType('contains');
    setKeywordsText('');
    setResponseMessage('');
    setButtons([]);
    setMediaFiles([]);
    setIsActive(true);
    setEditingRuleId(null);
    setShowModal(false);
  };

  const handleEdit = (rule) => {
    setEditingRuleId(rule.id || rule._id);
    setName(rule.name || '');
    setTriggerType(rule.trigger_type || rule.triggerType || 'contains');
    setKeywordsText((rule.keywords || []).join(', '));
    setResponseMessage(rule.response_message || rule.responseMessage || '');
    setButtons(rule.buttons || []);
    setMediaFiles(rule.media_files || rule.mediaFiles || []);
    setIsActive(rule.is_active !== false);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Rule name is required');
    if (!responseMessage.trim()) return toast.error('Response message is required');

    const keywords = keywordsText
      .split(/[,;\n]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      trigger_type: triggerType,
      keywords,
      response_message: responseMessage.trim(),
      buttons,
      media_files: mediaFiles,
      is_active: isActive,
    };

    if (editingRuleId) {
      updateRuleMutation.mutate({ id: editingRuleId, data: payload });
    } else {
      createRuleMutation.mutate(payload);
    }
  };

  const handleTestSimulation = (e) => {
    e?.preventDefault();
    if (!simMessage.trim()) return;
    testMutation.mutate({ message: simMessage.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-pink-50 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-purple-600 p-2 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">WhatsApp 24/7 Auto Responder Bot</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Set up automatic keyword-based replies, product catalogs, FAQ bots, and default fallback responses for all incoming customer messages.
          </p>
        </div>

        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Auto-Reply Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Rules Table (2 Cols) */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configured Auto-Reply Rules ({rules.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Trigger Type</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Matches</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id || rule._id}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">{rule.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{rule.response_message || rule.responseMessage}</p>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {rule.trigger_type || rule.triggerType || 'contains'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(rule.keywords || []).slice(0, 3).map((kw, i) => (
                              <span key={i} className="rounded bg-purple-50 px-1.5 py-0.5 text-[11px] font-medium text-purple-700">
                                {kw}
                              </span>
                            ))}
                            {(rule.keywords || []).length > 3 && (
                              <span className="text-[11px] text-gray-400">+{rule.keywords.length - 3} more</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={rule.is_active ? 'success' : 'default'}>
                            {rule.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-bold text-gray-800">{rule.match_count || 0} times</span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRuleMutation.mutate(rule.id || rule._id)}
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
                <div className="p-8 text-center text-sm text-gray-500">
                  No auto-responder rules defined yet. Click "Add Auto-Reply Rule" to create your first keyword bot!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interactive Chatbot Simulation Playground (1 Col) */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Live Responder Simulator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-500">
                Type an incoming WhatsApp customer message below to test which rule triggers and verify your bot's reply.
              </p>

              <form onSubmit={handleTestSimulation} className="flex gap-2">
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="e.g. what is the price?"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Button type="submit" size="sm" isLoading={testMutation.isPending}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>

              {/* Chat Simulation Window */}
              <div className="rounded-xl border border-gray-200 bg-[#E5DDD5] p-3 space-y-3 min-h-[220px] flex flex-col justify-end">
                {/* Incoming User Message */}
                <div className="self-start max-w-[80%] rounded-xl rounded-tl-xs bg-white p-2.5 shadow-xs text-xs text-gray-800">
                  <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Incoming Customer:</p>
                  <p>"{simMessage}"</p>
                </div>

                {/* Bot Auto-Reply */}
                {simResult ? (
                  simResult.matched ? (
                    <div className="self-end max-w-[85%] rounded-xl rounded-tr-xs bg-[#E7FFDB] p-2.5 shadow-xs text-xs text-gray-900 space-y-1.5 border border-[#c3f0b0]">
                      <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold border-b border-emerald-200 pb-1">
                        <span>🤖 Matched: {simResult.rule_name}</span>
                        <span className="capitalize">({simResult.trigger_type})</span>
                      </div>
                      <p className="whitespace-pre-wrap">{simResult.response_message}</p>

                      {simResult.buttons?.length > 0 && (
                        <div className="pt-1 space-y-1">
                          {simResult.buttons.map((b, i) => (
                            <div key={i} className="rounded bg-white py-1 px-2 text-center text-[10px] font-semibold text-[#00A884] border border-gray-200">
                              🔘 {b.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="self-end max-w-[85%] rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                      ⚠️ No matching auto-responder rule found for this message.
                    </div>
                  )
                ) : (
                  <p className="text-center text-[11px] text-gray-500 italic">
                    Press send icon to test auto-reply triggers
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingRuleId ? 'Edit Auto-Responder Rule' : 'Create Auto-Responder Rule'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Rule Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pricing Inquiries or Welcome Greeting"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Trigger Type"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                options={[
                  { value: 'contains', label: 'Message contains any keyword' },
                  { value: 'exact', label: 'Message matches keyword exactly' },
                  { value: 'starts_with', label: 'Message starts with keyword' },
                  { value: 'regex', label: 'Regular expression pattern' },
                  { value: 'default_fallback', label: 'Default Fallback (when no other rule matches)' },
                ]}
              />

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Rule Active & Listening
                </label>
              </div>
            </div>

            {triggerType !== 'default_fallback' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Trigger Keywords (comma separated) *
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="price, cost, pricing, rate, quotation"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  If customer message matches any of these keywords, the bot will auto-reply.
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Auto Response Message *</label>
              <textarea
                rows={4}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Hi {{name}}, thanks for contacting us! Our pricing plans start at ₹999. Click below to view the catalog."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">Supports dynamic variables: &#123;&#123;name&#125;&#125;, &#123;&#123;phone&#125;&#125;</p>
            </div>

            {/* Interactive Buttons for Auto-Reply */}
            <InteractiveButtonsBuilder buttons={buttons} onChange={setButtons} />

            {/* Media Files for Auto-Reply */}
            <MediaAttachmentManager mediaFiles={mediaFiles} onChange={setMediaFiles} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}>
                {editingRuleId ? 'Update Rule' : 'Save Auto-Responder'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
