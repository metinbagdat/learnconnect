// Runtime SES / lockdown / initialization guard for egitim.today
// This module is imported for its side effects only. It must be safe in all environments.

type AnyError = unknown;

function toMessage(err: AnyError): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  // Fallback for arbitrary values
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isSesRelated(msg: string): boolean {
  if (!msg) return false;
  const patterns = [
    'SES_UNCAUGHT_EXCEPTION',
    'lockdown-install.js',
    'Removing intrinsics.%',
    '%MapPrototype%.getOrInsert',
    '%WeakMapPrototype%.getOrInsert',
    '%DatePrototype%.toTemporalInstant',
    "React is undefined",
    "can't access property \"useState\", React is undefined"
  ];
  return patterns.some((p) => msg.includes(p));
}

declare global {
  interface Window {
    __egitimTodaySesGuardActive?: boolean;
    __egitimTodayMountOk?: boolean;
    __egitimTodaySesErrorsSeen?: boolean;
  }
}

function installGuards() {
  if (typeof window === 'undefined') return;

  // Track that the runtime guard is active
  window.__egitimTodaySesGuardActive = true;

  // Wrap console.error to downgrade SES noise
  if (typeof console !== 'undefined') {
    const originalError = console.error?.bind(console) ?? (() => {});
    console.error = ((...args: any[]) => {
      try {
        const msg = args.map(toMessage).join(' ');
        if (isSesRelated(msg)) {
          window.__egitimTodaySesErrorsSeen = true;
          // Downgrade to warning instead of throwing red errors
          console.warn?.('[SES guard] Suppressed SES-related console error:', msg);
          return;
        }
      } catch {
        // Never throw from guard
      }
      originalError(...args);
    }) as typeof console.error;
  }

  function handleGlobalEvent(event: ErrorEvent | PromiseRejectionEvent) {
    try {
      const raw =
        (event as ErrorEvent).message ||
        toMessage((event as PromiseRejectionEvent).reason) ||
        toMessage((event as any).error);

      if (isSesRelated(raw)) {
        window.__egitimTodaySesErrorsSeen = true;
        console.warn?.('[SES guard] Suppressed SES-related global error:', raw);
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof (event as any).stopImmediatePropagation === 'function') {
          (event as any).stopImmediatePropagation();
        }
      }
    } catch {
      // Guard must never crash
    }
  }

  window.addEventListener('error', handleGlobalEvent as EventListener, true);
  window.addEventListener(
    'unhandledrejection',
    handleGlobalEvent as EventListener,
    true
  );

  // After a grace period, if React never mounted and SES errors were seen,
  // show a friendly message instead of a blank screen.
  setTimeout(() => {
    try {
      if (window.__egitimTodayMountOk) return;
      if (!window.__egitimTodaySesErrorsSeen) return;

      const root = document.getElementById('root');
      if (!root) return;

      root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;color:#111827;font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;padding:24px;text-align:center;">
          <div>
            <h1 style="font-size:24px;font-weight:700;margin-bottom:12px;">Uygulama yüklenemedi</h1>
            <p style="margin-bottom:8px;">
              Güvenlik veya kripto cüzdanı gibi tarayıcı eklentileri, <strong>egitim.today</strong> sitesinin çalışmasını engelliyor olabilir.
            </p>
            <p style="margin-bottom:8px;">
              Lütfen bu sayfa için ilgili eklentileri geçici olarak devre dışı bırakıp sayfayı yeniden yüklemeyi deneyin.
            </p>
            <p style="font-size:12px;color:#6b7280;margin-top:12px;">
              Eğer sorun devam ederse, farklı bir tarayıcıda veya gizli sekmede tekrar deneyin.
            </p>
          </div>
        </div>
      `;
    } catch {
      // Last-resort guard; swallow errors
    }
  }, 8000);
}

installGuards();

