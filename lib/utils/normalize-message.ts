const MESSAGE_SEPARATOR = ", ";

/** Turns an API message (`string | string[]`) into one string. Never re-define this inline. */
export function normalizeMessage(message: string | string[] | null | undefined): string {
  if (!message) {
    return "";
  }

  return Array.isArray(message) ? message.join(MESSAGE_SEPARATOR) : message;
}
