import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';

import { notificationsApi } from '../../services/notifications';
import { formatRelativeTime } from '../../utils/format';

export default function Header({ title, subtitle, actions }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
    staleTime: 1000 * 60,
  });

  const notifications = useMemo(() => {
    const rawNotifications = Array.isArray(data?.data) ? data.data : [];

    return rawNotifications.map((notification) => {
      if (notification.type === 'upload') {
        return {
          ...notification,
          icon: Upload,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
        };
      }

      if (notification.type === 'message') {
        return {
          ...notification,
          icon: MessageSquare,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
        };
      }

      if (notification.type === 'success') {
        return {
          ...notification,
          icon: CheckCircle2,
          iconColor: 'text-primary-600',
          iconBg: 'bg-primary-100',
        };
      }

      return {
        ...notification,
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
      };
    });
  }, [data]);

  const unreadCount = data?.unreadCount || notifications.length;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showNotifications]);

  return (
    <header className="border-b border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              aria-label="Open notifications"
              onClick={() => {
                setShowNotifications((current) => !current);
                if (!showNotifications) {
                  refetch();
                }
              }}
              className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Bell className="h-5 w-5" />
              {unreadCount ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              ) : null}
            </button>

            {showNotifications ? (
              <div className="absolute right-0 top-12 z-30 w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-500">
                      {unreadCount} recent updates
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      {isFetching ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center px-4 py-10 text-sm text-gray-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading notifications...
                    </div>
                  ) : isError ? (
                    <div className="px-4 py-10 text-center text-sm text-red-500">
                      Failed to load notifications.
                    </div>
                  ) : notifications.length ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0"
                      >
                        <div
                          className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${notification.iconBg}`}
                        >
                          <notification.icon className={`h-5 w-5 ${notification.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <span className="whitespace-nowrap text-xs text-gray-400">
                              {notification.createdAt
                                ? formatRelativeTime(notification.createdAt)
                                : 'Recently'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {actions}
        </div>
      </div>
    </header>
  );
}
