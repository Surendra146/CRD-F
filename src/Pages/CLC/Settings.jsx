import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2,
  CheckCircle2,
  LogOut,
  Shield,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '../../components/Layout/Header.jsx';
import Button from '../../components/UI/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/card.jsx';
import { authApi } from '../../services/auth.js';
import { useAuthStore } from '../../store/authstore.js';
import { hasRoleAccess } from '../../utils/rbac.js';

const DEFAULT_THRESHOLDS = {
  activeCustomerDays: 30,
  atRiskCustomerDays: 60,
  churnedCustomerDays: 90,
};

function normalizeData(payload) {
  return payload?.data?.data || payload?.data || payload || null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const tenantCode = user?.tenantCode || user?.organization?.tenantCode || 'Not available';
  const canManageMembers = hasRoleAccess(user?.role, ['admin']);

  const settingsQuery = useQuery({
    queryKey: ['organization-settings'],
    queryFn: () => authApi.getOrganizationSettings().then(normalizeData),
    onSuccess: (data) => {
      const nextThresholds = data?.customerLifecycleThresholds;

      if (nextThresholds) {
        setThresholds({
          activeCustomerDays: Number(nextThresholds.activeCustomerDays) || DEFAULT_THRESHOLDS.activeCustomerDays,
          atRiskCustomerDays: Number(nextThresholds.atRiskCustomerDays) || DEFAULT_THRESHOLDS.atRiskCustomerDays,
          churnedCustomerDays: Number(nextThresholds.churnedCustomerDays) || DEFAULT_THRESHOLDS.churnedCustomerDays,
        });
      }
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload) => authApi.updateOrganizationSettings(payload).then(normalizeData),
    onSuccess: (data) => {
      const nextThresholds = data?.customerLifecycleThresholds;

      if (nextThresholds) {
        setThresholds({
          activeCustomerDays: Number(nextThresholds.activeCustomerDays) || DEFAULT_THRESHOLDS.activeCustomerDays,
          atRiskCustomerDays: Number(nextThresholds.atRiskCustomerDays) || DEFAULT_THRESHOLDS.atRiskCustomerDays,
          churnedCustomerDays: Number(nextThresholds.churnedCustomerDays) || DEFAULT_THRESHOLDS.churnedCustomerDays,
        });
      }

      toast.success('Customer lifecycle thresholds updated');
      settingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Unable to update lifecycle thresholds');
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThresholdChange = (key, value) => {
    const numericValue = Number.parseInt(value, 10);
    setThresholds((current) => ({
      ...current,
      [key]: Number.isFinite(numericValue) ? numericValue : '',
    }));
  };

  const handleSaveThresholds = () => {
    const activeCustomerDays = Number.parseInt(thresholds.activeCustomerDays, 10);
    const atRiskCustomerDays = Number.parseInt(thresholds.atRiskCustomerDays, 10);
    const churnedCustomerDays = Number.parseInt(thresholds.churnedCustomerDays, 10);

    if (!Number.isFinite(activeCustomerDays) || !Number.isFinite(atRiskCustomerDays) || !Number.isFinite(churnedCustomerDays)) {
      toast.error('Please enter valid numbers for all threshold fields');
      return;
    }

    if (!(activeCustomerDays < atRiskCustomerDays && atRiskCustomerDays < churnedCustomerDays)) {
      toast.error('Threshold order must be Active < At Risk < Churned');
      return;
    }

    updateSettingsMutation.mutate({
      customerLifecycleThresholds: {
        activeCustomerDays,
        atRiskCustomerDays,
        churnedCustomerDays,
      },
    });
  };

  return (
    <div>
      <Header title="Settings" subtitle="Account, access control, and customer lifecycle rules" />

      <div className="grid grid-cols-1 gap-6 p-8 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <p className="font-semibold text-gray-900">{user?.name || 'Unknown user'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'No email available'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
                <Building2 className="h-4 w-4" />
                Organization
              </div>
              <p className="text-sm font-medium text-gray-800">
                {user?.organization?.name || user?.companyName || 'Not configured'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Tenant Code: {tenantCode}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
                <Shield className="h-4 w-4" />
                Security
              </div>
              <p className="text-sm font-medium text-gray-800">
                {token ? 'Session active' : 'No active session'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Role: {user?.role || 'viewer'}</p>
            </div>

            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Access Management</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {canManageMembers ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Link
                    to="/roles"
                    className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-sm"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">Role Creation</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create role names and choose which sidebar modules are visible for assigned users.
                    </p>
                  </Link>

                  <Link
                    to="/users"
                    className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-sm"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">User Creation</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Add login users and assign the right role profile for their sidebar access.
                    </p>
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Your role can view settings, but role and user management are limited to admin and owner users.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Lifecycle Threshold Days</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Active Customer</span>
                  <input
                    type="number"
                    min="1"
                    value={thresholds.activeCustomerDays}
                    onChange={(event) => handleThresholdChange('activeCustomerDays', event.target.value)}
                    disabled={!canManageMembers}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-primary-300 transition focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Days since last purchase for active status.</p>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">At Risk Customer</span>
                  <input
                    type="number"
                    min="2"
                    value={thresholds.atRiskCustomerDays}
                    onChange={(event) => handleThresholdChange('atRiskCustomerDays', event.target.value)}
                    disabled={!canManageMembers}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-primary-300 transition focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Starts at-risk classification from this day onward.</p>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Churned Customer</span>
                  <input
                    type="number"
                    min="3"
                    value={thresholds.churnedCustomerDays}
                    onChange={(event) => handleThresholdChange('churnedCustomerDays', event.target.value)}
                    disabled={!canManageMembers}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-primary-300 transition focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Starts churned classification from this day onward.</p>
                </label>
              </div>

              {canManageMembers ? (
                <div className="flex items-center justify-end">
                  <Button onClick={handleSaveThresholds} disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Thresholds'}
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Threshold values are managed by admin or owner users.
                </div>
              )}

              {settingsQuery.isError ? (
                <p className="text-sm text-red-600">
                  Unable to load current threshold settings. Showing default values.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Notes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>Tenant members should only see modules allowed by their assigned role.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>Threshold changes are organization-level and affect lifecycle status recalculation.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>Use admin or owner accounts to manage RBAC and lifecycle settings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
