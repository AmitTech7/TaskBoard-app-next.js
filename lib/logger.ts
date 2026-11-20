/* eslint-disable no-console -- this is the ONLY file allowed to touch `console`. */

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const noop = () => undefined;

/** The single place that wraps `console`. Use `logger().error(...)`, never `console.*`. */
export function logger(): Logger {
  return {
    // Chatty levels are silenced in production.
    debug: IS_PRODUCTION ? noop : console.debug,
    info: IS_PRODUCTION ? noop : console.info,
    warn: console.warn,
    error: console.error,
  };
}
