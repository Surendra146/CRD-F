import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckSquare, LayoutPanelLeft, Pencil, ShieldCheck } from 'lucide-react';

import Header from '../components/Layout/Header';
import Button from '../components/UI/button';
import Input from '../components/UI/input';
import Modal from '../components/UI/modal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/card';
import { getEnabledSidebarModules } from '../config/sidebarModules';
import { authApi } from '../services/auth';
import { formatApiError } from '../config';
import { moduleAccessKey } from '../utils/moduleAccess';

const ROLE_BASELINE = 'custom';

export default function Roles() {
  const queryClient = useQueryClient();
  const allModules = useMemo(() => getEnabledSidebarModules(), []);
  const assignableModules = useMemo(() => {
    const items = [];

    allModules.forEach((module) => {
      const children = Array.isArray(module.children) ? module.children : [];

      if (children.length) {
        children.forEach((child) => {
          items.push({
            key: moduleAccessKey(child),
            label: child.label,
            roles: child.roles,
          });
        });
        return;
      }

      items.push({
        key: moduleAccessKey(module),
        label: module.label,
        roles: module.roles,
      });
    });

    return items.filter(
      (item, index) => item.key && items.findIndex((candidate) => candidate.key === item.key) === index
    );
  }, [allModules]);
  const [form, setForm] = useState({
    name: '',
    modules: ['dashboard', 'customers', 'analytics'],
  });
  const [editingRole, setEditingRole] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    modules: [],
  });

  const moduleOptions = useMemo(
    () => assignableModules.map((module) => ({ value: module.key, label: module.label })),
    [assignableModules]
  );
  const editModuleOptions = useMemo(
    () => assignableModules.map((module) => ({ value: module.key, label: module.label })),
    [assignableModules]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['role-profiles'],
    queryFn: () => authApi.getRoles().then((res) => res.data),
  });

  const customRoles = Array.isArray(data?.customRoles) ? data.customRoles : [];

  const createRoleMutation = useMutation({
    mutationFn: (payload) => authApi.createRole(payload),
    onSuccess: () => {
      toast.success('Role created successfully');
      setForm({
        name: '',
        modules: ['dashboard', 'customers', 'analytics'],
      });
      queryClient.invalidateQueries({ queryKey: ['role-profiles'] });
    },
    onError: (error) => toast.error(formatApiError(error)),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleKey, payload }) => authApi.updateRole(roleKey, payload),
    onSuccess: () => {
      toast.success('Role updated successfully');
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ['role-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-members'] });
    },
    onError: (error) => toast.error(formatApiError(error)),
  });

  const toggleModule = (moduleKey, mode = 'create') => {
    const setter = mode === 'edit' ? setEditForm : setForm;

    setter((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleKey)
        ? prev.modules.filter((item) => item !== moduleKey)
        : [...prev.modules, moduleKey],
    }));
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setEditForm({
      name: role.name,
      modules: Array.isArray(role.modules) ? role.modules : [],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (!form.modules.length) {
      toast.error('Select at least one sidebar module');
      return;
    }

    createRoleMutation.mutate({
      name: form.name.trim(),
      baseRole: ROLE_BASELINE,
      modules: form.modules,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (!editForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (!editForm.modules.length) {
      toast.error('Select at least one sidebar module');
      return;
    }

    updateRoleMutation.mutate({
      roleKey: editingRole.key,
      payload: {
        name: editForm.name.trim(),
        baseRole: ROLE_BASELINE,
        modules: editForm.modules,
      },
    });
  };

  return (
    <div>
      <Header
        title="Role Creation"
        subtitle="Create role names and control which sidebar modules are visible after login."
      />

      <div className="grid grid-cols-1 gap-6 p-8 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Create Role</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Role name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Sales Executive"
              />

              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Sidebar modules
                </label>

                <div className="grid gap-2">
                  {moduleOptions.map((module) => {
                    const checked = form.modules.includes(module.value);

                    return (
                      <label
                        key={module.value}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                          checked
                            ? 'border-primary-300 bg-primary-50 text-primary-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{module.label}</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary-600"
                          checked={checked}
                          onChange={() => toggleModule(module.value)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={createRoleMutation.isPending}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading role profiles...</p>
              ) : null}
              {customRoles.length ? (
                customRoles.map((role) => (
                  <div key={role.key} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{role.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <LayoutPanelLeft className="h-4 w-4" />
                          {role.modules.length} modules
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRole(role)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {role.modules.map((module) => (
                        <span
                          key={`${role.key}-${module}`}
                          className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No custom roles created yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <CheckSquare className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>Selected modules are used to hide or show sidebar items for the assigned login user.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={Boolean(editingRole)}
        onClose={() => setEditingRole(null)}
        title="Edit Role"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Role name"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sidebar modules
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              {editModuleOptions.map((module) => {
                const checked = editForm.modules.includes(module.value);

                return (
                  <label
                    key={module.value}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      checked
                        ? 'border-primary-300 bg-primary-50 text-primary-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{module.label}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary-600"
                      checked={checked}
                      onChange={() => toggleModule(module.value, 'edit')}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateRoleMutation.isPending}>
              Save Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
