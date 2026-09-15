/**
 * SES/Lockdown Guard Module
 * 
 * This module provides runtime protection against SES (Secure EcmaScript) and lockdown
 * browser extensions that can cause the app to fail with a white screen.
 * 
 * The guard intercepts SES-related errors and treats them as non-fatal, while keeping
 * normal errors visible for debugging.
 */

// Flag to track if we've seen any SES-related errors
let sesErrorsSeen = 0;
let reactMounted = false;

// Track when the module loads
const moduleLoadTime = Date.now();

/**
 * Helper function to detect if an error is SES-related
 */
function isSesError(err: unknown): boolean {
  if (!err) return false;
  
  const errorStr = String(err);
  const message = typeof err === 'object' && err !== null && 'message' in err 
    ? String((err as any).message) 
    : errorStr;
  const stack = typeof err === 'object' && err !== null && 'stack' in err 
    ? String((err as any).stack) 
    : '';
  
  // Check for SES-specific patterns
  const sesPatterns = [
    'SES_UNCAUGHT_EXCEPTION',
    'lockdown-install.js',
    'Removing intrinsics.%',
    'lockdown',
    'SES_',
  ];
  
  for (const pattern of sesPatterns) {
    if (message.includes(pattern) || stack.includes(pattern) || errorStr.includes(pattern)) {
      return true;
    }
  }
  
  // Check for "React is undefined" when it appears in SES context
  const isReactUndefinedError = message.includes('React is undefined') || 
                                 message.includes("can't access property \"useState\", React is undefined");
  const hasSesContext = stack.includes('lockdown') || stack.includes('SES') || errorStr.includes('SES');
  
  if (isReactUndefinedError && hasSesContext) {
    return true;
  }
  
  return false;
}

/**
 * Wrap console methods to suppress SES/lockdown noise
 */
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;

function wrapConsoleMethod(method: (...args: any[]) => void) {
  return function(...args: any[]) {
    const hasSesError = args.some(arg => isSesError(arg));
    if (hasSesError) {
      sesErrorsSeen++;
      return;
    }
    method.apply(console, args);
  };
}

console.error = wrapConsoleMethod(originalConsoleError);
console.warn = wrapConsoleMethod(originalConsoleWarn);
console.info = wrapConsoleMethod(originalConsoleInfo);
console.log = wrapConsoleMethod(originalConsoleLog);
console.debug = wrapConsoleMethod(originalConsoleDebug);

/**
 * Install global error handlers for runtime errors
 */
window.addEventListener('error', (event) => {
  const error = event.error || event.message;
  
  if (isSesError(error) || isSesError(event.message)) {
    sesErrorsSeen++;
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
  
  // Let normal errors propagate
  return true;
}, true);

/**
 * Install handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  
  if (isSesError(reason)) {
    sesErrorsSeen++;
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
  
  // Let normal rejections propagate
  return true;
}, true);

// Configuration constants
const REACT_MOUNT_TIMEOUT_MS = 10000; // 10 seconds
const MIN_CONTENT_LENGTH = 200; // Minimum text length indicating React has rendered content

/**
 * Check if React has mounted after a timeout
 * If not mounted and we've seen SES errors, show a fallback message
 */
setTimeout(() => {
  const root = document.getElementById('root');
  
  if (!root) {
    return; // No root element, nothing we can do
  }
  
  // Check if React has rendered content (more than just the fallback text)
  // React apps typically render substantial content, so 200+ chars is a good indicator
  const hasContent = root.children.length > 0 || 
                     (root.textContent && root.textContent.length > MIN_CONTENT_LENGTH);
  
  if (!hasContent && sesErrorsSeen > 0) {
    (window as any).__sesGuardFallbackTriggered = true;
    
    // Show a helpful message in Turkish
    root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 500px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        ">
          <h1 style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: bold;">
            🔒 Güvenlik Eklentisi Algılandı
          </h1>
          <p style="margin-bottom: 1rem; line-height: 1.6;">
            Tarayıcınızdaki güvenlik eklentileri uygulamanın yüklenmesini engelliyor olabilir.
          </p>
          <p style="margin-bottom: 1rem; line-height: 1.6;">
            Lütfen aşağıdaki adımları deneyin:
          </p>
          <ol style="text-align: left; margin-bottom: 1rem; padding-left: 1.5rem; line-height: 1.8;">
            <li>Güvenlik eklentilerinizi geçici olarak devre dışı bırakın</li>
            <li>Gizli pencere (incognito) modunda açmayı deneyin</li>
            <li>Sayfayı yenileyin</li>
          </ol>
          <button 
            onclick="window.location.reload()" 
            style="
              background: white;
              color: #667eea;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-weight: bold;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 1rem;
            "
          >
            🔄 Sayfayı Yenile
          </button>
        </div>
      </div>
    `;
  } else if (hasContent) {
    reactMounted = true;
    (window as any).__sesGuardReactMounted = true;
  }
}, REACT_MOUNT_TIMEOUT_MS);

// Set a debug flag
(window as any).__egitimTodaySesGuardActive = true;
(window as any).__sesErrorCount = () => sesErrorsSeen;
