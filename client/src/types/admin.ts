// Admin User Types and Roles

export type AdminRole = 'super_admin' | 'content_admin' | 'viewer';

export interface AdminPermissions {
  manage_content: boolean;
  manage_users: boolean;
  view_analytics: boolean;
  manage_admins: boolean;
  export_data: boolean;
  delete_data: boolean;
}

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  createdAt: Date;
  lastLoginAt?: Date;
  createdBy?: string;
  isActive: boolean;
}

// Role-based permission definitions
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    manage_content: true,
    manage_users: true,
    view_analytics: true,
    manage_admins: true,
    export_data: true,
    delete_data: true
  },
  content_admin: {
    manage_content: true,
    manage_users: false,
    view_analytics: true,
    manage_admins: false,
    export_data: true,
    delete_data: false
  },
  viewer: {
    manage_content: false,
    manage_users: false,
    view_analytics: true,
    manage_admins: false,
    export_data: false,
    delete_data: false
  }
};

// Helper function to check permissions
export function hasPermission(
  role: AdminRole,
  permission: keyof AdminPermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Tüm yetkiler - Sistem yönetimi ve admin yönetimi',
  content_admin: 'İçerik yönetimi - Müfredat ve ders ekleme/düzenleme',
  viewer: 'Sadece görüntüleme - Analytics ve raporları görüntüleme'
};
