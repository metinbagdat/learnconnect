import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/notifications/${id}`, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const unread = notificationsArray.filter((n: any) => !n.read);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unread.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unread.length}
            </Badge>
          )}
        </div>
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-950 border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationsArray.length > 0 ? (
              notificationsArray.map((notif: any) => (
                <div key={notif.id} className="p-3 border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsReadMutation.mutate(notif.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500">No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
