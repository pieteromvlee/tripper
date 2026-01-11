/**
 * Logging utility that only logs in development mode
 *
 * In production, console statements are suppressed to avoid console noise.
 * This can be easily extended to integrate with error tracking services.
 */

export const logger = {
  /**
   * Log error messages (only in development)
   */
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
    // TODO: In production, send to error tracking service (e.g., Sentry)
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },

  /**
   * Log info messages (only in development)
   */
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
};
