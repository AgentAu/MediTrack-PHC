/**
 * search.js
 * ------------------------------------------------------------------
 * Firestore can't do "contains" text search, so each patient stores
 * a `searchKeywords` array of lowercase prefixes of their name,
 * patient ID and phone number. Searching is then a single
 * `array-contains` query, e.g. "hau" matches "Hauwa".
 * ------------------------------------------------------------------
 */

const MAX_PREFIX = 40;

function prefixesOf(text) {
  const out = [];
  for (let i = 1; i <= Math.min(text.length, MAX_PREFIX); i += 1) out.push(text.slice(0, i));
  return out;
}

/**
 * Builds the keyword array stored on each patient document.
 * @param {{ patientId: string, firstName: string, lastName: string, phone: string }} patient
 * @returns {string[]}
 */
export function buildSearchKeywords({ patientId, firstName, lastName, phone }) {
  const first = (firstName || "").toLowerCase();
  const last = (lastName || "").toLowerCase();
  const id = (patientId || "").toLowerCase(); // "phc-0012"
  const idNumber = id.replace(/^phc-/, ""); // "0012"
  const idNumberNoZeros = String(parseInt(idNumber, 10) || ""); // "12"
  const phoneDigits = (phone || "").replace(/\D/g, "");

  const terms = [
    first,
    last,
    `${first} ${last}`,
    `${last} ${first}`,
    ...`${first} ${last}`.split(/\s+/), // each word of multi-word names
    id,
    idNumber,
    idNumberNoZeros,
    phoneDigits,
  ];

  const keywords = new Set();
  terms.filter(Boolean).forEach((term) => prefixesOf(term).forEach((p) => keywords.add(p)));
  return [...keywords];
}

/**
 * Normalises what the user typed into the form stored in keywords.
 * Phone-looking input ("0803 123 4567") is reduced to digits.
 * @param {string} raw
 * @returns {string}
 */
export function normaliseSearchTerm(raw) {
  const term = String(raw || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_PREFIX);
  if (/^[\d\s+\-()]+$/.test(term)) return term.replace(/\D/g, "");
  return term;
}
