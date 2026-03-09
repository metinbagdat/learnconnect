import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type SystemSuccessMetrics = {
  aiAccuracy: number;
  userEngagement: number;
  goalCompletionRate: number;
  systemReliability: number;
  userSatisfaction: number;
  timeToValue: string;
  scalability: string;
};

type TrialStats = {
  count: number;
  avgNet: number;
  latestNet: number;
  netSeries: number[];
};

type LiveStatsSectionProps = {
  context?: 'home' | 'dashboard';
  showRoutine?: boolean;
  routineTargetLabel?: string;
  routineProgress?: number;
  routineCtaHref?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function MiniBarChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-t bg-gradient-to-t from-blue-500/70 to-indigo-400/70"
          style={{ height: `${clamp((value / max) * 100, 8, 100)}%` }}
        />
      ))}
    </div>
  );
}

function MiniLineChart({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="rgba(59, 130, 246, 0.8)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`${points} 100,100 0,100`}
        fill="rgba(59, 130, 246, 0.15)"
        stroke="none"
      />
    </svg>
  );
}

export default function LiveStatsSection({
  context = 'home',
  showRoutine = true,
  routineTargetLabel,
  routineProgress,
  routineCtaHref
}: LiveStatsSectionProps) {
  const [, setLocation] = useLocation();
  const [systemMetrics, setSystemMetrics] = useState<SystemSuccessMetrics | null>(null);
  const [systemMetricsLoading, setSystemMetricsLoading] = useState(true);
  const [systemMetricsError, setSystemMetricsError] = useState<string | null>(null);
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [trialStatsStatus, setTrialStatsStatus] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      setSystemMetricsLoading(true);
      setSystemMetricsError(null);

      try {
        const response = await fetch('/api/system/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch system metrics');
        }
        const payload = await response.json();
        if (isMounted) {
          setSystemMetrics(payload?.data ?? null);
        }
      } catch (error) {
        console.error('Error fetching system metrics:', error);
        if (isMounted) {
          setSystemMetricsError('İstatistikler yüklenemedi');
        }
      } finally {
        if (isMounted) setSystemMetricsLoading(false);
      }
    };

    const loadTrialStats = async () => {
      setTrialStatsStatus('loading');
      try {
        const response = await fetch('/api/tyt/trials', { credentials: 'include' });
        if (response.status === 401) {
          if (isMounted) setTrialStatsStatus('unauthorized');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch trial stats');
        }
        const trials = await response.json();
        const list = Array.isArray(trials) ? trials : [];
        const nets = list
          .map((trial: any) => Number(trial?.netScore || 0))
          .filter((value: number) => Number.isFinite(value))
          .slice(0, 6)
          .reverse();

        const count = list.length;
        const latestNet = count > 0 ? Number(list[0]?.netScore || 0) : 0;
        const avgNet = count > 0
          ? Math.round(list.reduce((sum: number, t: any) => sum + Number(t?.netScore || 0), 0) / count)
          : 0;

        if (isMounted) {
          setTrialStats({ count, avgNet, latestNet, netSeries: nets });
          setTrialStatsStatus('ready');
        }
      } catch (error) {
        console.error('Error fetching trial stats:', error);
        if (isMounted) setTrialStatsStatus('error');
      }
    };

    loadMetrics();
    loadTrialStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const systemSeries = useMemo(() => {
    if (!systemMetrics) return [];
    return [
      systemMetrics.aiAccuracy,
      systemMetrics.goalCompletionRate,
      systemMetrics.userEngagement,
      systemMetrics.systemReliability
    ];
  }, [systemMetrics]);

  const trialCtaLabel = context === 'home' ? 'Denemelerimi Gör' : 'Deneme Ekle';
  const trialCtaHref = context === 'home' ? '/login' : '/tyt/trials/new';
  const routineTarget = routineTargetLabel ?? '2 deneme';
  const routineProgressValue = routineProgress ?? 60;
  const routineHref = routineCtaHref ?? trialCtaHref;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-gray-100 lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle>Deneme & İstatistik Merkezi</CardTitle>
              <CardDescription>Canlı API verileriyle anlık performans özeti.</CardDescription>
            </div>
            <Badge variant="secondary">Live API</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'AI Başarı Oranı',
                value: systemMetrics ? `${systemMetrics.aiAccuracy}%` : '--',
                helper: 'Model doğruluğu'
              },
              {
                label: 'Hedef Tamamlama',
                value: systemMetrics ? `${systemMetrics.goalCompletionRate}%` : '--',
                helper: 'Plan tamamlama'
              },
              {
                label: 'Kullanıcı Etkileşimi',
                value: systemMetrics ? `${systemMetrics.userEngagement}%` : '--',
                helper: 'Son 30 gün'
              }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-4">
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.helper}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="font-semibold text-gray-900">Deneme Performansı</div>
              <p className="text-sm text-gray-500">
                {trialStatsStatus === 'unauthorized'
                  ? 'Giriş yaparak deneme istatistiklerinizi görüntüleyin.'
                  : trialStatsStatus === 'error'
                  ? 'Deneme verileri yüklenemedi.'
                  : 'Son denemelerinizin net ortalaması ve trendi.'}
              </p>
              {trialStatsStatus === 'ready' && trialStats?.netSeries?.length ? (
                <div className="mt-3">
                  <MiniLineChart values={trialStats.netSeries} />
                </div>
              ) : null}
            </div>
            {trialStatsStatus === 'ready' ? (
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">{trialStats?.count || 0} deneme</Badge>
                <Badge variant="secondary">Ort. {trialStats?.avgNet || 0} net</Badge>
                <Badge variant="secondary">Son {trialStats?.latestNet || 0} net</Badge>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setLocation(trialCtaHref)}>
                {trialCtaLabel}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Sistem Güvenilirliği', value: systemMetrics ? `${systemMetrics.systemReliability}%` : '--' },
              { label: 'Kullanıcı Memnuniyeti', value: systemMetrics ? `${systemMetrics.userSatisfaction}/5` : '--' },
              { label: 'Time-to-Value', value: systemMetrics ? systemMetrics.timeToValue : '--' }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-4">
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="font-semibold">AI Performans Grafiği</div>
              <p className="text-sm text-gray-500">Sistem metriklerinin anlık dağılımı.</p>
            </div>
            <div className="w-full md:max-w-[240px]">
              {systemSeries.length > 0 ? <MiniBarChart values={systemSeries} /> : <div className="h-12" />}
            </div>
          </div>

          {(systemMetricsLoading || systemMetricsError) && (
            <div className="text-xs text-gray-500">
              {systemMetricsLoading && 'İstatistikler güncelleniyor...'}
              {systemMetricsError && ` • ${systemMetricsError}`}
            </div>
          )}
        </CardContent>
      </Card>

      {showRoutine ? (
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle>Deneme Rutini</CardTitle>
            <CardDescription>Hedefe giden yolda haftalık deneme takibi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Bu hafta hedef</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">{routineTarget}</div>
              <Progress value={routineProgressValue} className="mt-3" />
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Sonraki deneme</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">Cumartesi 10:00</div>
              <p className="text-xs text-gray-500 mt-2">Bildirimle hatırlatma al</p>
            </div>
            <Button className="w-full" onClick={() => setLocation(routineHref)}>
              Deneme Planı Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
