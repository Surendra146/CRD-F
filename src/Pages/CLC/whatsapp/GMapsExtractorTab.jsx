import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Search,
  Download,
  UserPlus,
  Star,
  Globe,
  Phone,
  CheckCircle2,
  Filter,
  Send,
  Building,
  RefreshCw,
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
import { formatNumber } from '../../../utils/format.js';

export default function GMapsExtractorTab({ onSendToBulkMarketing }) {
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('Real Estate Agents');
  const [location, setLocation] = useState('Hyderabad');
  const [resultLimit, setResultLimit] = useState(25);

  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [phoneOnlyFilter, setPhoneOnlyFilter] = useState(true);

  // Quick preset niches
  const niches = [
    'Real Estate Agents',
    'Dentists & Clinics',
    'Restaurants & Cafes',
    'Car Showrooms & Garages',
    'Gyms & Fitness Centers',
    'Interior Designers',
    'Software Companies',
    'Schools & Coaching',
  ];

  // Search Mutation
  const searchMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.searchGMaps(data),
    onSuccess: (res) => {
      const results = res?.data || [];
      setLeads(results);
      setSelectedLeadIds(new Set(results.map((l) => l.id)));
      toast.success(`Found ${results.length} business leads from Google Maps!`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to extract Google Maps leads');
    },
  });

  // Import to Customers Mutation
  const importMutation = useMutation({
    mutationFn: (data) => marketingToolsApi.importGMapsLeads(data),
    onSuccess: (res) => {
      toast.success(res?.message || 'Leads imported into Customer Database');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-customers'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to import leads');
    },
  });

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim() || !location.trim()) {
      toast.error('Please enter both business category and location');
      return;
    }
    searchMutation.mutate({
      query: query.trim(),
      location: location.trim(),
      limit: Number(resultLimit) || 25,
    });
  };

  const filteredLeads = leads.filter((l) => {
    if (phoneOnlyFilter && !l.phone) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelectLead = (id) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeadIds(next);
  };

  const handleImportSelected = () => {
    const selectedList = filteredLeads.filter((l) => selectedLeadIds.has(l.id));
    if (!selectedList.length) {
      toast.error('Please select at least one lead to import');
      return;
    }
    importMutation.mutate({
      leads: selectedList,
      tag: `gmaps-${location.toLowerCase().replace(/\s+/g, '-')}`,
    });
  };

  const handleExportCSV = () => {
    const list = filteredLeads.filter((l) => selectedLeadIds.has(l.id));
    if (!list.length) {
      toast.error('No leads selected to export');
      return;
    }

    const headers = ['Business Name', 'Phone', 'Category', 'Rating', 'Reviews', 'Address', 'Website'];
    const rows = list.map((l) => [
      `"${(l.business_name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.category || ''}"`,
      `"${l.rating || ''}"`,
      `"${l.reviews_count || 0}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.website || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gmaps_leads_${query}_${location}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${list.length} leads to CSV`);
  };

  const handleSendToBulk = () => {
    const selectedPhones = filteredLeads
      .filter((l) => selectedLeadIds.has(l.id) && l.phone)
      .map((l) => ({ name: l.business_name, phone: l.phone }));

    if (!selectedPhones.length) {
      toast.error('No selected leads with phone numbers');
      return;
    }
    if (onSendToBulkMarketing) {
      onSendToBulkMarketing(selectedPhones);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Description */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-600 p-2 text-white shadow-sm">
              <MapPin className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">Google Map Data Extractor</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Extract local business leads, verified mobile numbers, and ratings across any city, and import them with 1 click into your Customer Database!
          </p>
        </div>

        {leads.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
              <p className="text-xs text-gray-500">Extracted Leads</p>
              <p className="text-lg font-bold text-gray-900">{formatNumber(leads.length)}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 shadow-xs">
              <p className="text-xs text-blue-700 font-medium">Selected</p>
              <p className="text-lg font-bold text-blue-800">{selectedLeadIds.size}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar Card */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Business Niche / Category *"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Dentists, Real Estate, Cafes"
              />
              <Input
                label="City / Location *"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hyderabad, Bangalore, Mumbai"
              />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Limit</label>
                  <select
                    value={resultLimit}
                    onChange={(e) => setResultLimit(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
                  >
                    <option value={15}>15 Leads</option>
                    <option value={25}>25 Leads</option>
                    <option value={50}>50 Leads</option>
                    <option value={100}>100 Leads</option>
                  </select>
                </div>
                <Button type="submit" isLoading={searchMutation.isPending} className="shrink-0">
                  <Search className="mr-2 h-4 w-4" />
                  Extract Leads
                </Button>
              </div>
            </div>

            {/* Quick Niche Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-gray-500 mr-1">Popular categories:</span>
              {niches.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setQuery(n);
                  }}
                  className={`rounded-full border px-2.5 py-1 transition-all ${
                    query === n
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Extracted Leads Table */}
      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle>Extracted Business Directory ({filteredLeads.length})</CardTitle>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneOnlyFilter}
                    onChange={(e) => setPhoneOnlyFilter(e.target.checked)}
                    className="rounded text-primary-600"
                  />
                  <span>Show With Phone Only</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={selectedLeadIds.size === 0}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendToBulk}
                  disabled={selectedLeadIds.size === 0}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Send WhatsApp Campaign
                </Button>

                <Button
                  size="sm"
                  onClick={handleImportSelected}
                  isLoading={importMutation.isPending}
                  disabled={selectedLeadIds.size === 0}
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Import to Customers ({selectedLeadIds.size})
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <TableRow key={lead.id} className={isSelected ? 'bg-blue-50/30' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{lead.business_name}</span>
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" /> Website
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded w-max">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            <span>{lead.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No phone</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{lead.category}</Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-gray-800">{lead.rating}</span>
                          <span className="text-gray-400">({lead.reviews_count})</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs text-gray-600 truncate max-w-xs" title={lead.address}>
                          {lead.address}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
