'use client';

import { useAppStore } from '@/lib/store';
import { formatDate, formatTime } from '@/lib/utils';

export default function AdminPage() {
  const adminNotifications = useAppStore((state) => state.adminNotifications);
  const resolveAdminNotification = useAppStore((state) => state.resolveAdminNotification);
  const clearAdminNotifications = useAppStore((state) => state.clearAdminNotifications);

  const unresolvedNotifications = adminNotifications.filter(n => !n.resolved);
  const resolvedNotifications = adminNotifications.filter(n => n.resolved);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'recipe_source_error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'api_error':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Notifications</h1>
      
      {adminNotifications.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No notifications. The system will alert you here when recipe sources cannot be read or other issues occur.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {unresolvedNotifications.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-medium">Active Issues ({unresolvedNotifications.length})</h2>
                {unresolvedNotifications.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Mark all as resolved?')) {
                        unresolvedNotifications.forEach(n => resolveAdminNotification(n.id));
                      }
                    }}
                    className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Resolve All
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {unresolvedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg p-4 border ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {notification.type === 'recipe_source_error' && '🚨 Recipe Source Error'}
                            {notification.type === 'api_error' && '⚠️ API Error'}
                            {notification.type === 'other' && 'ℹ️ Notification'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(notification.timestamp)} {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</p>
                        {notification.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                              Show details
                            </summary>
                            <pre className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(notification.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <button
                        onClick={() => resolveAdminNotification(notification.id)}
                        className="ml-2 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolvedNotifications.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  Resolved ({resolvedNotifications.length})
                </h2>
                <button
                  onClick={() => {
                    if (confirm('Clear all resolved notifications?')) {
                      clearAdminNotifications();
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {resolvedNotifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {formatDate(notification.timestamp)} {formatTime(notification.timestamp)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
