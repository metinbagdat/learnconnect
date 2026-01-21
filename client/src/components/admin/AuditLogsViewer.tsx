import { useState, useEffect } from 'react';
import { getAuditLogs, type AuditLog, ACTION_LABELS } from '@/services/auditLogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BilingualText } from '@/components/ui/bilingual-text';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/consolidated-language-context';
import { FileText, User, Calendar, Activity } from 'lucide-react';

export default function AuditLogsViewer() {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'curriculum' | 'user' | 'ai'>('all');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  async function loadLogs() {
    setLoading(true);
    try {
      let resourceType: AuditLog['resourceType'] | undefined;
      
      if (filter === 'curriculum') {
        resourceType = 'curriculum';
      } else if (filter === 'user') {
        resourceType = 'user';
      } else if (filter === 'ai') {
        resourceType = 'ai_plan';
      }
      
      const fetchedLogs = await getAuditLogs({ 
        limitCount: 100,
        resourceType 
      });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    if (action.includes('ai_')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <BilingualText text="Admin İşlem Geçmişi – Admin Audit Logs" />
          </CardTitle>
          <Badge variant="secondary">{logs.length} kayıt</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
            }`}
          >
            <BilingualText text="Tümü – All" />
          </button>
          <button
            onClick={() => setFilter('curriculum')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'curriculum'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
            }`}
          >
            <BilingualText text="Müfredat – Curriculum" />
          </button>
          <button
            onClick={() => setFilter('user')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
            }`}
          >
            <BilingualText text="Kullanıcı – Users" />
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'ai'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
            }`}
          >
            AI
          </button>
        </div>

        {/* Logs List */}
        <div className="border rounded-lg divide-y dark:border-slate-700 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p><BilingualText text="Henüz kayıt yok – No logs yet" /></p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionColor(log.action)}>
                        {language === 'tr'
                          ? ACTION_LABELS[log.action]?.tr || log.action
                          : ACTION_LABELS[log.action]?.en || log.action}
                      </Badge>
                      {log.examType && (
                        <Badge variant="outline" className="text-xs">
                          {log.examType.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      {log.resourceName && (
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {log.resourceName}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {log.timestamp.toLocaleString('tr-TR')}
                        </span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">
                            Detaylar
                          </summary>
                          <pre className="text-xs bg-gray-100 dark:bg-slate-900 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>

                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
