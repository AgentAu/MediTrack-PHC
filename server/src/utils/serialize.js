/**
 * Converts a Firestore document into plain JSON for the API:
 * Timestamps become ISO strings and internal-only fields are dropped.
 */

const INTERNAL_FIELDS = new Set(["searchKeywords"]);

function convert(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(convert);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convert(v)]));
  }
  return value;
}

/**
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 * @param {string} idField - name to expose the document ID under
 */
export function serializeDoc(doc, idField = "id") {
  const data = doc.data() || {};
  const out = { [idField]: doc.id };
  Object.entries(data).forEach(([key, value]) => {
    if (!INTERNAL_FIELDS.has(key)) out[key] = convert(value);
  });
  return out;
}
