/**
 * Small pure helpers carried over from the original utils.js.
 */

/** "2026-07-30" -> "30 Jul 2026" */
export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** ISO datetime -> "30 Jul 2026, 14:05" */
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return "—";
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Age in whole years from a yyyy-mm-dd date of birth. */
export function calculateAge(isoDob) {
  if (!isoDob) return null;
  const dob = new Date(`${isoDob}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

/** Today as yyyy-mm-dd in the browser's local time. */
export function todayIso() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** "Hauwa", "Bello" -> "HB" */
export function getInitials(firstName, lastName) {
  const first = (firstName || "").trim().charAt(0);
  const last = (lastName || "").trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

/** "hAUWA bello" -> "Hauwa Bello" */
export function capitalizeWords(str) {
  return (str || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** "1 record" / "3 records" */
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
