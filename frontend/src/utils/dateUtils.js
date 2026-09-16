/**
 * dateUtils.js
 * ------------
 * Centralized Date & Time formatting utility configured for Indian Standard Time (IST).
 * TimeZone: Asia/Kolkata
 * Locale: en-IN
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_LOCALE = 'en-IN';

/**
 * Format a date object/ISO string into IST date format (e.g., "17 Sep 2026" or "Sep 17, 2026")
 */
export function formatISTDate(dateInput, options = {}) {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';

    const defaultOptions = {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(IST_LOCALE, defaultOptions).format(date);
  } catch (err) {
    console.error('Error formatting IST date:', err);
    return 'N/A';
  }
}

/**
 * Format a date object/ISO string into IST time format (e.g., "05:30 PM" or "05:30:15 PM IST")
 */
export function formatISTTime(dateInput, options = {}) {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';

    const defaultOptions = {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    };
    return new Intl.DateTimeFormat(IST_LOCALE, defaultOptions).format(date);
  } catch (err) {
    console.error('Error formatting IST time:', err);
    return 'N/A';
  }
}

/**
 * Format date and time in IST (e.g., "17 Sep 2026, 05:30 PM IST")
 */
export function formatISTDateTime(dateInput, showISTSuffix = true) {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';

    const formatted = new Intl.DateTimeFormat(IST_LOCALE, {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    return showISTSuffix ? `${formatted} IST` : formatted;
  } catch (err) {
    console.error('Error formatting IST datetime:', err);
    return 'N/A';
  }
}

/**
 * Returns human relative time, or IST date/time if older than 24 hours
 */
export function formatISTRelative(dateInput) {
  if (!dateInput) return 'Just now';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return `Yesterday at ${formatISTTime(date)}`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return formatISTDate(date);
  } catch (err) {
    return 'Recently';
  }
}
