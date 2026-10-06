import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users2,
  UserPlus,
  Link,
  Download,
  Copy,
  ExternalLink,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/UI/button.jsx';
import Badge from '../../../components/UI/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/card.jsx';
import Input from '../../../components/UI/input.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/UI/table.jsx';
import { marketingToolsApi } from '../../../services/marketingTools.js';

export default function GroupToolsTab({ onSendToBulkMarketing }) {
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState('grabber'); // 'grabber' or 'joiner'

  // ==========================================
  // GRABBER STATE (Feature 6: Grab Group Members)
  // ==========================================
  const [groupName, setGroupName] = useState('Business WhatsApp Group');
  const [rawParticipantText, setRawParticipantText] = useState('');
  const [extractedMembers, setExtractedMembers] = useState([]);

  // ==========================================
  // JOINER STATE (Feature 5: Auto Group Joiner)
  // ==========================================
  const [groupLinksInput, setGroupLinksInput] = useState('');
  const [parsedLinks, setParsedLinks] = useState([]);
  const [, setJoiningIndex] = useState(-1);

  // Mutations
  const grabMembersMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.grabGroupMembers(data),
    onSuccess: (res) => {
      const list = res?.data || [];
      setExtractedMembers(list);
      toast.success(`Extracted ${list.length} group member contacts!`);
    },
    onError: (err) => toast.error(err?.message || 'Failed to extract group contacts'),
  });

  const importMembersMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.importGroupMembers(data),
    onSuccess: (res) => {
      toast.success(res?.message || 'Group members imported as customers!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-customers'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to import contacts'),
  });

  const parseLinksMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.parseGroupLinks(data),
    onSuccess: (res) => {
      const list = res?.data || [];
      setParsedLinks(list);
      toast.success(`Validated ${list.filter((l) => l.is_valid).length} group links!`);
    },
    onError: (err) => toast.error(err?.message || 'Failed to parse group links'),
  });

  // Grabber Handlers
  const handleGrabMembers = (e) => {
    e?.preventDefault();
    if (!rawParticipantText.trim()) {
      toast.error('Please paste group member participant text or chat log');
      return;
    }
    grabMembersMutation.mutate({
      task_type: 'grab_members',
      title: `Grab from ${groupName}`,
      group_name: groupName,
      raw_text: rawParticipantText,
    });
  };

  const handleImportMembers = () => {
    if (!extractedMembers.length) {
      toast.error('No members extracted to import');
      return;
    }
    importMembersMutation.mutate({
      members: extractedMembers,
      group_name: groupName,
    });
  };

  // Joiner Handlers
  const handleParseLinks = (e) => {
    e?.preventDefault();
    if (!groupLinksInput.trim()) {
      toast.error('Please paste WhatsApp group links');
      return;
    }
    const links = groupLinksInput.split(/[\r\n,;]+/).map((l) => l.trim()).filter(Boolean);
    parseLinksMutation.mutate({
      task_type: 'auto_join',
      title: 'Group Joiner Queue',
      group_links: links,
    });
  };

  const handleOpenNextGroup = (index) => {
    const item = parsedLinks[index];
    if (!item || !item.invite_code) return;
    window.open(`https://chat.whatsapp.com/${item.invite_code}`, '_blank');
    setJoiningIndex(index);
    const updated = [...parsedLinks];
    updated[index] = { ...updated[index], status: 'opened' };
    setParsedLinks(updated);
  };

  const handleSendToBulk = () => {
    if (!extractedMembers.length) return;
    if (onSendToBulkMarketing) {
      onSendToBulkMarketing(extractedMembers.map((m) => ({ name: m.name, phone: m.phone })));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-600 p-2 text-white shadow-sm">
              <Users2 className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">WhatsApp Group Marketing Suite</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Parse numbers from text you provide and validate invite-link formats. This tool does not read group membership or join groups through Meta.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('grabber')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeSubTab === 'grabber'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            1. Grab Group Members
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('joiner')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeSubTab === 'joiner'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            2. Auto Group Joiner
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: GRAB GROUP MEMBERS */}
      {/* ======================================================== */}
      {activeSubTab === 'grabber' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Paste Group Members / Chat Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Group Name *"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Hyderabad Business Network"
              />

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Paste WhatsApp Group Info or Participants
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Tip: On WhatsApp Web, open any group → Click Group Info → Select and copy the participants text.
                </p>
                <textarea
                  rows={10}
                  value={rawParticipantText}
                  onChange={(e) => setRawParticipantText(e.target.value)}
                  placeholder="You, +91 98765 43210, John (+91 99887 76655), +91 91234 56789 joined via invite..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleGrabMembers}
                isLoading={grabMembersMutation.isPending}
              >
                <Users2 className="mr-2 h-4 w-4" />
                Extract Contacts
              </Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {extractedMembers.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">
                        Extracted Group Members ({extractedMembers.length})
                      </CardTitle>
                      <p className="text-xs text-gray-500">Group: {groupName}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendToBulk}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                        Send WhatsApp Broadcast
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleImportMembers}
                        isLoading={importMembersMutation.isPending}
                      >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Import as Customers ({extractedMembers.length})
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Source Snippet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedMembers.map((m, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-gray-400 text-xs font-mono">{idx + 1}</TableCell>
                            <TableCell className="font-semibold text-xs text-gray-900">{m.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded w-max">
                                <Phone className="h-3 w-3 text-teal-600" />
                                <span>{m.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-400 truncate max-w-xs">{m.raw_match}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-gray-500 space-y-2">
                  <Users2 className="h-10 w-10 mx-auto text-gray-300" />
                  <p className="font-medium text-gray-800">No group contacts extracted yet</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Paste group member text from WhatsApp Web or group export on the left to extract clean phone numbers for your campaigns.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: AUTO GROUP JOINER */}
      {/* ======================================================== */}
      {activeSubTab === 'joiner' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Paste WhatsApp Group Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Group Invite Links (1 per line)
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Links must be in format: <code className="bg-gray-100 px-1 py-0.5 rounded">https://chat.whatsapp.com/Code...</code>
                </p>
                <textarea
                  rows={10}
                  value={groupLinksInput}
                  onChange={(e) => setGroupLinksInput(e.target.value)}
                  placeholder="https://chat.whatsapp.com/ABC123xyz456...&#10;https://chat.whatsapp.com/DEF789uvw012..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleParseLinks}
                isLoading={parseLinksMutation.isPending}
              >
                <Link className="mr-2 h-4 w-4" />
                Validate & Prepare Queue
              </Button>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            {parsedLinks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Group Join Queue ({parsedLinks.filter((l) => l.is_valid).length} Valid)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Invite Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedLinks.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-gray-400 text-xs font-mono">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex flex-col font-mono text-xs">
                                <span className="font-semibold text-gray-900">{item.invite_code || 'Invalid Link'}</span>
                                <span className="text-[10px] text-gray-400 truncate max-w-xs">{item.original_url}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.is_valid ? (
                                item.status === 'opened' ? (
                                  <Badge variant="success">Opened</Badge>
                                ) : (
                                  <Badge variant="info">Ready to Join</Badge>
                                )
                              ) : (
                                <Badge variant="destructive">Invalid Link</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.is_valid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenNextGroup(idx)}
                                >
                                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                  Join Group
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-gray-500 space-y-2">
                  <Link className="h-10 w-10 mx-auto text-gray-300" />
                  <p className="font-medium text-gray-800">No group links in queue</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Paste WhatsApp group invite links on the left to organize and join them without getting flagged for fast spamming.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
