import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdminAuth } from './use-admin-auth';
import type { AdminRole, AdminPermissions } from '@/types/admin';
import { ROLE_PERMISSIONS, hasPermission } from '@/types/admin';

interface AdminPermissionsState {
  role: AdminRole | null;
  permissions: AdminPermissions | null;
  loading: boolean;
  canManageContent: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageAdmins: boolean;
  canExportData: boolean;
  canDeleteData: boolean;
}

/**
 * Hook for checking admin permissions based on role
 */
export function useAdminPermissions(): AdminPermissionsState {
  const { user, isAdmin, loading: authLoading } = useAdminAuth();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!user || !isAdmin) {
        setRole(null);
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          const adminRole = (adminData.role as AdminRole) || 'viewer';
          
          setRole(adminRole);
          setPermissions(ROLE_PERMISSIONS[adminRole]);
        } else {
          // Default to viewer if admin doc doesn't have role
          setRole('viewer');
          setPermissions(ROLE_PERMISSIONS.viewer);
        }
      } catch (error) {
        console.error('Error loading admin permissions:', error);
        setRole('viewer');
        setPermissions(ROLE_PERMISSIONS.viewer);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadPermissions();
    }
  }, [user, isAdmin, authLoading]);

  return {
    role,
    permissions,
    loading: authLoading || loading,
    canManageContent: permissions?.manage_content || false,
    canManageUsers: permissions?.manage_users || false,
    canViewAnalytics: permissions?.view_analytics || false,
    canManageAdmins: permissions?.manage_admins || false,
    canExportData: permissions?.export_data || false,
    canDeleteData: permissions?.delete_data || false
  };
}
