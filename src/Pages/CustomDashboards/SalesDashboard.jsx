import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChartLine, Calendar, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useDashboard } from '../../context/useDashboard';
import { useAuthStore } from '../../store/authstore';
import { formatDate } from '../../utils/helpers';
import { normalizeAllowedModules } from '../../utils/moduleAccess';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/UI/dialog';
import Button from '../../components/UI/button';
import Input from '../../components/UI/input';
import { Label } from '../../components/UI/label';

export default function SalesDashboard() {
  const { dashboards, loading, fetchDashboards, createDashboard, deleteDashboard } = useDashboard();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    excelSourcesCount: 1,
    sourceNames: ['']
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const handleSourceCountChange = (count) => {
    const num = parseInt(count, 10) || 1;
    const newSourceNames = Array(num).fill('').map((_, i) =>
      formData.sourceNames[i] || `Source ${i + 1}`
    );
    setFormData({ ...formData, excelSourcesCount: num, sourceNames: newSourceNames });
  };

  const handleSourceNameChange = (index, value) => {
    const newSourceNames = [...formData.sourceNames];
    newSourceNames[index] = value;
    setFormData({ ...formData, sourceNames: newSourceNames });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Dashboard name is required');
      return;
    }
    const hasEmptySource = formData.sourceNames.some((name) => !name.trim());
    if (hasEmptySource) {
      toast.error('All source names are required');
      return;
    }

    setCreating(true);
    try {
      const dashboard = await createDashboard(formData);
      toast.success('Dashboard created successfully!');
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', excelSourcesCount: 1, sourceNames: [''] });
      if (dashboard?._id) {
        navigate(`/dashboards/${dashboard._id}/upload`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create dashboard');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await deleteDashboard(id);
        toast.success('Dashboard deleted');
      } catch {
        toast.error('Failed to delete dashboard');
      }
    }
  };

  const normalizedRole = (user?.role || '').toString().trim().toLowerCase();
  const canCreateOrDelete =
    normalizeAllowedModules(user?.allowedModules).includes('custom-dashboards') ||
    ['owner', 'admin'].includes(normalizedRole);

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Custom Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Manage and build sales dashboards.</p>
          </div>

          {canCreateOrDelete ? (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="primary" className="rounded-none px-6 py-3 font-bold uppercase tracking-widest text-sm">
                  <Plus size={18} weight="bold" className="mr-2" />
                  New Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-2 border-black">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter">Create Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Dashboard Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Q1 Sales Dashboard"
                      className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Track quarterly sales metrics"
                      className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Number of Excel Sources</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.excelSourcesCount}
                      onChange={(e) => handleSourceCountChange(e.target.value)}
                      className="mt-2 rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3 block">Source Names</Label>
                    <div className="space-y-2">
                      {formData.sourceNames.map((name, index) => (
                        <Input
                          key={index}
                          value={name}
                          onChange={(e) => handleSourceNameChange(index, e.target.value)}
                          placeholder={`Source ${index + 1}`}
                          className="rounded-none border-gray-200 focus:ring-2 focus:ring-black"
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={creating} variant="primary" className="w-full rounded-none py-3 font-bold uppercase tracking-widest text-sm">
                    {creating ? 'Creating...' : 'Create Dashboard'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading dashboards...</p>
          </div>
        ) : dashboards.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-none">
            <ChartLine size={48} weight="bold" className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-800 mb-2">No dashboards yet</p>
            <p className="text-sm text-gray-600">Create your first dashboard to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {dashboards.filter((dashboard) => dashboard?._id).map((dashboard) => (
              <div
                key={dashboard._id}
                onClick={() => navigate(`/dashboards/${dashboard._id}`)}
                className="border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:border-black group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-black">
                      {dashboard.name}
                    </h3>
                    {dashboard.description ? (
                      <p className="text-sm text-gray-600 leading-relaxed">{dashboard.description}</p>
                    ) : null}
                  </div>

                  {canCreateOrDelete ? (
                    <Button
                      onClick={(e) => handleDelete(dashboard._id, e)}
                      variant="ghost"
                      size="sm"
                      className="rounded-none border border-gray-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash size={16} weight="bold" />
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} weight="bold" />
                    <span>{formatDate(dashboard.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartLine size={14} weight="bold" />
                    <span>{dashboard.excelSourcesConfig?.length || 0} Sources</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
