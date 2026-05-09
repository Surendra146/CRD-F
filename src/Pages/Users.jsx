import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Pencil, Shield, UserPlus, Users as UsersIcon } from 'lucide-react';

import Header from '../components/Layout/Header';
import Button from '../components/UI/button';
import Input from '../components/UI/input';
import Modal from '../components/UI/modal';
import Select from '../components/UI/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/card';
import { authApi } from '../services/auth';
import { formatApiError } from '../services/api';

export default function Users() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    selectedRole: '',
  });
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    selectedRole: '',
  });

  const { data: rolesData } = useQuery({
    queryKey: ['role-profiles'],
    queryFn: () => authApi.getRoles().then((res) => res.data),
  });

  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['tenant-members'],
    queryFn: () => authApi.getMembers(),
  });

  const roleProfiles = useMemo(() => {
    const custom = Array.isArray(rolesData?.customRoles) ? rolesData.customRoles : [];
    return custom;
  }, [rolesData]);

  const roleOptions = useMemo(
    () =>
      roleProfiles.map((role) => ({
        value: role.key,
        label: role.name,
      })),
    [roleProfiles]
  );

  const members = Array.isArray(membersData?.data) ? membersData.data : [];

  const createMemberMutation = useMutation({
    mutationFn: (payload) => authApi.createMember(payload),
    onSuccess: () => {
      toast.success('User created successfully');
      setForm({ name: '', email: '', password: '', selectedRole: '' });
      queryClient.invalidateQueries({ queryKey: ['tenant-members'] });
    },
    onError: (error) => toast.error(formatApiError(error)),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ userId, payload }) => authApi.updateMemberAccess(userId, payload),
    onSuccess: () => {
      toast.success('User access updated');
      queryClient.invalidateQueries({ queryKey: ['tenant-members'] });
    },
    onError: (error) => toast.error(formatApiError(error)),
  });

  const editMemberMutation = useMutation({
    mutationFn: ({ userId, payload }) => authApi.updateMember(userId, payload),
    onSuccess: () => {
      toast.success('User updated successfully');
      setEditingMember(null);
      queryClient.invalidateQueries({ queryKey: ['tenant-members'] });
      queryClient.invalidateQueries({ queryKey: ['role-profiles'] });
    },
    onError: (error) => toast.error(formatApiError(error)),
  });

  const getRoleProfile = (roleKeyOrName) =>
    roleProfiles.find((role) => role.key === roleKeyOrName || role.name === roleKeyOrName);

  const isOwnerMember = (member) => member?.isOwner || member?.role === 'owner';

  const getMemberRoleKey = (member) =>
    isOwnerMember(member)
      ? ''
      :
    getRoleProfile(member.roleProfileName)?.key || getRoleProfile(member.role)?.key || '';

  const openEditMember = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      password: '',
      selectedRole: getMemberRoleKey(member),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedProfile = getRoleProfile(form.selectedRole);
    if (!selectedProfile) {
      toast.error('Select a role profile');
      return;
    }

    createMemberMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim() || undefined,
      role: selectedProfile.baseRole,
      roleProfileName: selectedProfile.name,
      allowedModules: selectedProfile.modules,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    const ownerMember = isOwnerMember(editingMember);
    const selectedProfile = ownerMember ? null : getRoleProfile(editForm.selectedRole);
    if (!ownerMember && !selectedProfile) {
      toast.error('Select a role profile');
      return;
    }

    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    editMemberMutation.mutate({
      userId: editingMember.id,
      payload: {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        password: editForm.password.trim() || undefined,
        role: ownerMember ? 'owner' : selectedProfile.baseRole,
        roleProfileName: ownerMember ? editingMember.roleProfileName || 'Owner' : selectedProfile.name,
        allowedModules: ownerMember ? editingMember.allowedModules : selectedProfile.modules,
      },
    });
  };

  return (
    <div>
      <Header
        title="User Creation"
        subtitle="Create login users and assign the correct role profile with sidebar visibility."
      />

      <div className="grid grid-cols-1 gap-6 p-8 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label="Temporary password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Optional"
              />
              <Select
                label="Role profile"
                value={form.selectedRole}
                options={roleOptions}
                onChange={(e) => setForm((prev) => ({ ...prev, selectedRole: e.target.value }))}
              />

              <Button type="submit" className="w-full" isLoading={createMemberMutation.isPending}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Users</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {isMembersLoading ? (
                <p className="text-sm text-slate-500">Loading users...</p>
              ) : members.length ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                            Base role: {member.role}
                          </span>
                          <span className="rounded-full bg-primary-50 px-3 py-1 font-medium text-primary-700">
                            Profile: {member.roleProfileName || member.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex w-full max-w-xs items-end gap-2">
                        {isOwnerMember(member) ? (
                          <div className="w-full">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Role profile
                            </label>
                            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                              Owner
                            </div>
                          </div>
                        ) : (
                          <Select
                            label="Change role profile"
                            value={getMemberRoleKey(member)}
                            options={roleOptions}
                            onChange={(e) => {
                              const selectedProfile = getRoleProfile(e.target.value);
                              if (!selectedProfile) {
                                return;
                              }

                              updateMemberMutation.mutate({
                                userId: member.id,
                                payload: {
                                  role: selectedProfile.baseRole,
                                  roleProfileName: selectedProfile.name,
                                  allowedModules: selectedProfile.modules,
                                },
                              });
                            }}
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMember(member)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {member.allowedModules?.map((module) => (
                        <span
                          key={`${member.id}-${module}`}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No users found for this tenant.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Notes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>Each user keeps a backend base role for API permissions and a role profile for sidebar visibility.</p>
              </div>
              <div className="flex gap-2">
                <UsersIcon className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>Changing the role profile updates what the assigned login user can see in the sidebar.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title="Edit User"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full name"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="New password"
            value={editForm.password}
            onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Leave blank to keep current password"
          />
          {isOwnerMember(editingMember) ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role profile
              </label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                Owner
              </div>
            </div>
          ) : (
            <Select
              label="Role profile"
              value={editForm.selectedRole}
              options={roleOptions}
              onChange={(e) => setEditForm((prev) => ({ ...prev, selectedRole: e.target.value }))}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={editMemberMutation.isPending}>
              Save User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
