const MONTH_OFFSET = 1;
const PAD_LENGTH = 2;

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, "0");
}

/**
 * The ONLY way dates are shown in the UI: MM/DD/YYYY (e.g. 11/20/2026).
 * Returns "" for missing or invalid input so the UI never prints "NaN/NaN/NaN".
 */
export function formatDateDisplay(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad(date.getMonth() + MONTH_OFFSET)}/${pad(date.getDate())}/${date.getFullYear()}`;
}
