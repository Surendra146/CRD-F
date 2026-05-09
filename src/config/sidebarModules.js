import {
  BarChart3,
  LayoutDashboard,
  ChevronRight,
  PanelsTopLeft,
  Settings,
  Target,
  Upload,
  ShieldCheck,
  Users,
  UserPlus,
} from 'lucide-react';

export const sidebarModules = [
  {
    key: 'dashboard',
    accessKey: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,    enabled: true,
  },

  {
    key: 'customer-master-parent',
    accessKey: 'customers',
    label: 'Customer Master',
    href: '/customers/details',
    icon: Users,    children: [
      {
        key: 'customer-details',
        accessKey: 'customers',
        label: 'Customer Details',
        href: '/customers/details',
        icon: ChevronRight,        enabled: true,
      },
      {
        key: 'customer-sales',
        accessKey: 'customers',
        label: 'Customer Sales',
        href: '/customers/sales',
        icon: ChevronRight,        enabled: true,
      },
      {
        key: 'analytics',
        accessKey: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: ChevronRight,        enabled: true,
      },
    ],
    enabled: true,
  },

  {
    key: 'reports-parent',
    accessKey: 'reports',
    label: 'Reports',
    href: '/reports/recent-upload',
    icon: PanelsTopLeft,    children: [
      {
        key: 'reports-recent-upload-child',
        accessKey: 'reports',
        label: 'Recent Upload Report',
        href: '/reports/recent-upload',
        icon: ChevronRight,        enabled: true,
      },
    ],
    enabled: true,
  },

  {
    key: 'custom-dashboards-parent',
    accessKey: 'custom-dashboards',
    label: 'Custom Dashboard',
    href: '/custom-dashboards/sales',
    icon: PanelsTopLeft,    children: [
      {
        key: 'custom-dashboards-sales-child',
        accessKey: 'custom-dashboards',
        label: 'Sales Dashboard',
        href: '/custom-dashboards/sales',
        icon: ChevronRight,        enabled: true,
      },
    ],
    enabled: true,
  },

  {
    key: 'customer-excel-parent',
    accessKey: 'import',
    label: 'Customer Excel',
    href: '/import',
    icon: Upload,    children: [
      {
        key: 'import-data-child',
        accessKey: 'import',
        label: 'Import Data',
        href: '/import',
        icon: ChevronRight,        enabled: true,
      },
      {
        key: 'customer-segment-import-child',
        accessKey: 'campaigns',
        label: 'Customer Segment',
        href: '/segments/import',
        icon: ChevronRight,        enabled: true,
      },
    ],
    enabled: true,
  },

  {
    key: 'campaign-master',
    accessKey: 'campaigns',
    label: 'Campaign Master',
    href: '/campaigns',
    icon: Target,    children: [
      {
        key: 'campaigns-child',
        accessKey: 'campaigns',
        label: 'Campaigns',
        href: '/campaigns',
        icon: ChevronRight,        enabled: true,
      },
      {
        key: 'segments-child',
        accessKey: 'campaigns',
        label: 'Segments',
        href: '/segments',
        icon: ChevronRight,        enabled: true,
      },
      {
        key: 'templates-child',
        accessKey: 'templates',
        label: 'Templates',
        href: '/templates',
        icon: ChevronRight,        enabled: true,
      },
      {
        key: 'whatsapp-child',
        accessKey: 'whatsapp',
        label: 'WhatsApp',
        href: '/whatsapp',
        icon: ChevronRight,        enabled: true,
      },
    ],
    enabled: true,
  },

  {
    key: 'roles',
    accessKey: 'roles',
    label: 'Roles',
    href: '/roles',
    icon: ShieldCheck,    enabled: true,
  },
  {
    key: 'users',
    accessKey: 'users',
    label: 'Users',
    href: '/users',
    icon: UserPlus,    enabled: true,
  },
  {
    key: 'settings',
    accessKey: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,    enabled: true,
  },
];

export const getEnabledSidebarModules = () =>
  sidebarModules.filter((module) => module.enabled !== false);
