import log from 'loglevel';

const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'warn';

log.setLevel(import.meta.env.DEV ? 'debug' : (LOG_LEVEL as log.LogLevelDesc));

export const logger = {
  debug: log.debug.bind(log),
  info: log.info.bind(log),
  warn: log.warn.bind(log),
  error: log.error.bind(log),
};

export function sendErrorToServer(
  error: Error,
  context?: { componentStack?: string; extra?: Record<string, unknown> },
) {
  const payload = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...context,
  };

  logger.error('[Frontend Error]', payload);

  if (import.meta.env.PROD) {
    fetch('/api/logs/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    }).catch(() => {
      // 로그 전송 실패는 무시
    });
  }
}

// 전역 에러 핸들러
window.onerror = (message, source, lineno, colno, error) => {
  sendErrorToServer(error || new Error(String(message)), {
    extra: { source, lineno, colno },
  });
};

window.onunhandledrejection = (event) => {
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
  sendErrorToServer(error, { extra: { type: 'unhandledrejection' } });
};

export default logger;
