import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  variant?: 'default' | 'compact';
  scope?: 'system' | 'trials' | 'all';
  showRoutine?: boolean;
  routineTargetLabel?: string;
  routineProgress?: number;
  routineCtaHref?: string;
  refreshMs?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getTooltipLeft = (index: number, length: number) =>
  length > 1 ? ((index + 0.5) / length) * 100 : 50;

function ChartTooltip({ label, leftPercent }: { label: string; leftPercent: number }) {
  return (
    <div
      className="absolute -top-8 z-10 rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white shadow-lg"
      style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
    >
      {label}
    </div>
  );
}

function MiniBarChart({
  values,
  labels,
  compact,
  onHover,
  onLeave
}: {
  values: number[];
  labels: string[];
  compact?: boolean;
  onHover?: (index: number) => void;
  onLeave?: () => void;
}) {
  const max = Math.max(...values, 1);
  const gradientId = useId();
  const height = compact ? 32 : 40;
  const barWidth = values.length > 0 ? 100 / values.length : 100;
  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className={compact ? 'h-10 w-full' : 'h-12 w-full'}
      onMouseLeave={() => onLeave?.()}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.9)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0.5)" />
        </linearGradient>
      </defs>
      {values.map((value, index) => {
        const barHeight = clamp((value / max) * (height - 6), 6, height - 6);
        const x = index * barWidth + barWidth * 0.2;
        const y = height - barHeight;
        const width = barWidth * 0.6;
        return (
          <rect
            key={`${value}-${index}`}
            x={x}
            y={y}
            width={width}
            height={barHeight}
            rx={2}
            fill={`url(#${gradientId})`}
            onMouseEnter={() => onHover?.(index)}
            onFocus={() => onHover?.(index)}
            title={labels[index] ? `${labels[index]}: ${value}` : String(value)}
          />
        );
      })}
    </svg>
  );
}

function MiniLineChart({
  values,
  compact,
  onHover,
  onLeave
}: {
  values: number[];
  compact?: boolean;
  onHover?: (index: number) => void;
  onLeave?: () => void;
}) {
  if (values.length === 0) return null;
  const gradientId = useId();
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1 || 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return { x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const area = `${path} L 100 100 L 0 100 Z`;
  const heightClass = compact ? 'h-14' : 'h-16';
  return (
    <svg viewBox="0 0 100 100" className={`${heightClass} w-full`} onMouseLeave={() => onLeave?.()}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={path}
        fill="none"
        stroke="rgba(59, 130, 246, 0.9)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2.5"
          fill="rgba(37, 99, 235, 0.9)"
          onMouseEnter={() => onHover?.(index)}
          onFocus={() => onHover?.(index)}
          title={`Deneme ${index + 1}: ${values[index]} net`}
        />
      ))}
    </svg>
  );
}

export default function LiveStatsSection({
  context = 'home',
  variant = 'default',
  scope,
  showRoutine = true,
  routineTargetLabel,
  routineProgress,
  routineCtaHref,
  refreshMs = 30000
}: LiveStatsSectionProps) {
  const [, setLocation] = useLocation();
  const [systemMetrics, setSystemMetrics] = useState<SystemSuccessMetrics | null>(null);
  const [systemMetricsLoading, setSystemMetricsLoading] = useState(true);
  const [systemMetricsError, setSystemMetricsError] = useState<string | null>(null);
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [trialStatsStatus, setTrialStatsStatus] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>('connecting');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const reconnectDelayRef = useRef(1500);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [barHoverIndex, setBarHoverIndex] = useState<number | null>(null);
  const [lineHoverIndex, setLineHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/live-stats?interval=${refreshMs}&scope=${resolvedScope}`;

    const connect = () => {
      if (!isMounted) return;
      setConnectionStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'connecting'));
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        reconnectDelayRef.current = 1500;
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'live_stats') {
            setSystemMetrics(message.data?.systemMetrics ?? null);
            setSystemMetricsLoading(false);
            setSystemMetricsError(null);
            setTrialStats(message.data?.trialStats ?? null);
            setTrialStatsStatus(message.data?.trialStatus ?? 'error');
            setLastUpdatedAt(message.data?.updatedAt ?? new Date().toISOString());
          }
        } catch (error) {
          console.error('Live stats message error:', error);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('reconnecting');
        setSystemMetricsLoading(true);
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(15000, Math.round(delay * 1.6));
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        if (!isMounted) return;
        setConnectionStatus('error');
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [refreshMs, resolvedScope]);

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
  const isCompact = variant === 'compact';
  const cardPadding = isCompact ? 'p-3' : 'p-4';
  const metricValueClass = isCompact ? 'text-xl' : 'text-2xl';
  const metricGridClass = isCompact ? 'grid-cols-1 sm:grid-cols-3 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-4';
  const sectionClass = isCompact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6';
  const systemLabels = ['AI Başarı', 'Hedef', 'Etkileşim', 'Güvenilirlik'];
  const hoveredBarLabel =
    barHoverIndex !== null && systemSeries[barHoverIndex] != null
      ? `${systemLabels[barHoverIndex]}: ${systemSeries[barHoverIndex]}%`
      : 'Grafiğin üzerine gel';
  const hoveredLineLabel =
    lineHoverIndex !== null && trialStats?.netSeries?.[lineHoverIndex] != null
      ? `Deneme ${lineHoverIndex + 1}: ${trialStats.netSeries[lineHoverIndex]} net`
      : 'Grafik noktasına gel';
  const connectionBadge =
    connectionStatus === 'connected'
      ? 'Canlı'
      : connectionStatus === 'reconnecting'
      ? 'Yeniden bağlanıyor'
      : connectionStatus === 'error'
      ? 'Bağlantı hatası'
      : 'Bağlanıyor';
  const resolvedScope = scope ?? (context === 'home' ? 'system' : 'all');
  const trialTrend = useMemo(() => {
    if (!trialStats?.netSeries || trialStats.netSeries.length < 2) {
      return { direction: 'flat', delta: 0 };
    }
    const last = trialStats.netSeries[trialStats.netSeries.length - 1];
    const prev = trialStats.netSeries[trialStats.netSeries.length - 2];
    return { direction: last > prev ? 'up' : last < prev ? 'down' : 'flat', delta: Math.round(last - prev) };
  }, [trialStats]);

  return (
    <section className={sectionClass}>
      <Card className={`border-gray-100 ${isCompact ? '' : 'lg:col-span-2'}`}>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle>Deneme & İstatistik Merkezi</CardTitle>
              {!isCompact && (
                <CardDescription>Canlı API verileriyle anlık performans özeti.</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Live API</Badge>
              <Badge variant="secondary">{connectionBadge}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className={isCompact ? 'space-y-4' : 'space-y-5'}>
          <div className={`grid ${metricGridClass}`}>
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
              <div key={item.label} className={`rounded-lg border bg-white ${cardPadding}`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className={`${metricValueClass} font-semibold text-gray-900 mt-1`}>{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.helper}</div>
              </div>
            ))}
          </div>

          <div className={`rounded-lg border bg-white ${cardPadding} flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
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
                <div className="mt-3 relative">
                  <MiniLineChart
                    values={trialStats.netSeries}
                    compact={isCompact}
                    onHover={setLineHoverIndex}
                    onLeave={() => setLineHoverIndex(null)}
                  />
                  {lineHoverIndex !== null ? (
                    <ChartTooltip
                      label={hoveredLineLabel}
                      leftPercent={getTooltipLeft(lineHoverIndex, trialStats.netSeries.length)}
                    />
                  ) : null}
                  <div className="text-xs text-gray-500 mt-2">{hoveredLineLabel}</div>
                </div>
              ) : null}
            </div>
            {trialStatsStatus === 'ready' ? (
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">{trialStats?.count || 0} deneme</Badge>
                <Badge variant="secondary">Ort. {trialStats?.avgNet || 0} net</Badge>
                <Badge variant="secondary">Son {trialStats?.latestNet || 0} net</Badge>
                <Badge
                  variant="secondary"
                  className={
                    trialTrend.direction === 'up'
                      ? 'text-emerald-700'
                      : trialTrend.direction === 'down'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }
                >
                  {trialTrend.direction === 'up'
                    ? `↑ ${trialTrend.delta}`
                    : trialTrend.direction === 'down'
                    ? `↓ ${Math.abs(trialTrend.delta)}`
                    : '→ 0'}
                </Badge>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setLocation(trialCtaHref)}>
                {trialCtaLabel}
              </Button>
            )}
          </div>

          <div className={`grid ${metricGridClass}`}>
            {[
              { label: 'Sistem Güvenilirliği', value: systemMetrics ? `${systemMetrics.systemReliability}%` : '--' },
              { label: 'Kullanıcı Memnuniyeti', value: systemMetrics ? `${systemMetrics.userSatisfaction}/5` : '--' },
              { label: 'Time-to-Value', value: systemMetrics ? systemMetrics.timeToValue : '--' }
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border bg-white ${cardPadding}`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mt-1`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 ${cardPadding} flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
            <div>
              <div className="font-semibold">AI Performans Grafiği</div>
              <p className="text-sm text-gray-500">Sistem metriklerinin anlık dağılımı.</p>
            </div>
            <div className="w-full md:max-w-[240px] relative">
              {systemSeries.length > 0 ? (
                <MiniBarChart
                  values={systemSeries}
                  labels={systemLabels}
                  compact={isCompact}
                  onHover={setBarHoverIndex}
                  onLeave={() => setBarHoverIndex(null)}
                />
              ) : (
                <div className="h-12" />
              )}
              {barHoverIndex !== null && systemSeries.length > 0 ? (
                <ChartTooltip
                  label={hoveredBarLabel}
                  leftPercent={getTooltipLeft(barHoverIndex, systemSeries.length)}
                />
              ) : null}
              <div className="text-xs text-gray-500 mt-2">{hoveredBarLabel}</div>
            </div>
          </div>

          {(systemMetricsLoading || systemMetricsError) && (
            <div className="text-xs text-gray-500">
              {systemMetricsLoading && 'İstatistikler güncelleniyor...'}
              {systemMetricsError && ` • ${systemMetricsError}`}
            </div>
          )}
          {lastUpdatedAt && (
            <div className="text-xs text-gray-400">
              Son güncelleme: {new Date(lastUpdatedAt).toLocaleTimeString('tr-TR')}
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
