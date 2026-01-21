import { ReactNode } from 'react';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { BilingualText } from '@/components/ui/bilingual-text';
import { AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  require?: 'manage_content' | 'manage_users' | 'view_analytics' | 'manage_admins' | 'export_data' | 'delete_data';
  fallback?: ReactNode;
}

/**
 * Component to guard content based on admin permissions
 */
export function PermissionGuard({ children, require, fallback }: PermissionGuardProps) {
  const permissions = useAdminPermissions();

  if (permissions.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no specific permission required, just check if user is admin
  if (!require) {
    return <>{children}</>;
  }

  // Check specific permission
  const hasPermission = permissions.permissions?.[require] || false;

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          <BilingualText text="Yetkiniz Yok – No Permission" />
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          <BilingualText 
            text="Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır – You don't have permission for this action"
          />
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Gerekli yetki: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{require}</code>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Mevcut rol: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{permissions.role || 'unknown'}</code>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
