import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export type AuditAction = 
  | 'subject_created'
  | 'subject_updated'
  | 'subject_deleted'
  | 'topic_created'
  | 'topic_updated'
  | 'topic_deleted'
  | 'subtopic_created'
  | 'subtopic_updated'
  | 'subtopic_deleted'
  | 'user_status_changed'
  | 'admin_created'
  | 'admin_deleted'
  | 'curriculum_imported'
  | 'curriculum_exported'
  | 'ai_curriculum_generated'
  | 'ai_plan_generated';

export interface AuditLog {
  id?: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  resourceType: 'subject' | 'topic' | 'subtopic' | 'user' | 'admin' | 'curriculum' | 'ai_plan';
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  examType?: 'tyt' | 'ayt' | 'yks';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to audit trail
 */
export async function logAdminAction(log: Omit<AuditLog, 'userId' | 'userEmail' | 'timestamp'>) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('No authenticated user for audit log');
      return null;
    }

    const auditLog: AuditLog = {
      ...log,
      userId: currentUser.uid,
      userEmail: currentUser.email || 'unknown',
      timestamp: new Date()
    };

    const docRef = await addDoc(collection(db, 'audit_logs'), {
      ...auditLog,
      timestamp: Timestamp.fromDate(auditLog.timestamp)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error logging audit action:', error);
    return null;
  }
}

/**
 * Get recent audit logs
 */
export async function getAuditLogs(options?: {
  limitCount?: number;
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditLog['resourceType'];
  examType?: 'tyt' | 'ayt' | 'yks';
}) {
  try {
    const { limitCount = 50, userId, action, resourceType, examType } = options || {};
    
    let q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    // Apply filters
    if (userId) {
      q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else if (action) {
      q = query(
        collection(db, 'audit_logs'),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else if (resourceType) {
      q = query(
        collection(db, 'audit_logs'),
        where('resourceType', '==', resourceType),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else if (examType) {
      q = query(
        collection(db, 'audit_logs'),
        where('examType', '==', examType),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    } as AuditLog));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get audit stats
 */
export async function getAuditStats() {
  try {
    const logs = await getAuditLogs({ limitCount: 1000 });
    
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      userCounts[log.userEmail] = (userCounts[log.userEmail] || 0) + 1;
    });

    return {
      total: logs.length,
      actionCounts,
      userCounts,
      recentLogs: logs.slice(0, 10)
    };
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return null;
  }
}

// Action label translations
export const ACTION_LABELS: Record<AuditAction, { tr: string; en: string }> = {
  subject_created: { tr: 'Ders Oluşturuldu', en: 'Subject Created' },
  subject_updated: { tr: 'Ders Güncellendi', en: 'Subject Updated' },
  subject_deleted: { tr: 'Ders Silindi', en: 'Subject Deleted' },
  topic_created: { tr: 'Konu Oluşturuldu', en: 'Topic Created' },
  topic_updated: { tr: 'Konu Güncellendi', en: 'Topic Updated' },
  topic_deleted: { tr: 'Konu Silindi', en: 'Topic Deleted' },
  subtopic_created: { tr: 'Alt Konu Oluşturuldu', en: 'Subtopic Created' },
  subtopic_updated: { tr: 'Alt Konu Güncellendi', en: 'Subtopic Updated' },
  subtopic_deleted: { tr: 'Alt Konu Silindi', en: 'Subtopic Deleted' },
  user_status_changed: { tr: 'Kullanıcı Durumu Değişti', en: 'User Status Changed' },
  admin_created: { tr: 'Admin Oluşturuldu', en: 'Admin Created' },
  admin_deleted: { tr: 'Admin Silindi', en: 'Admin Deleted' },
  curriculum_imported: { tr: 'Müfredat İçe Aktarıldı', en: 'Curriculum Imported' },
  curriculum_exported: { tr: 'Müfredat Dışa Aktarıldı', en: 'Curriculum Exported' },
  ai_curriculum_generated: { tr: 'AI Müfredat Oluşturdu', en: 'AI Curriculum Generated' },
  ai_plan_generated: { tr: 'AI Plan Oluşturdu', en: 'AI Plan Generated' }
};
