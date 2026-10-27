/**
 * Date helpers that respect the clinic's time zone, so "today" means
 * today in Nigeria rather than on the server's clock.
 */

const TIME_ZONE = process.env.CLINIC_TIMEZONE || "Africa/Lagos";

/**
 * Today's date as yyyy-mm-dd in the clinic's time zone.
 * (The en-CA locale formats dates as yyyy-mm-dd.)
 * @returns {string}
 */
export function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * True if the string is a real calendar date in yyyy-mm-dd format.
 * @param {string} value
 */
export function isValidIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
