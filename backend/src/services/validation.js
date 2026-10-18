/**
 * Validation helpers untuk parameter dan input
 */

/**
 * Validasi ID parameter (harus integer positif)
 * @param {string|number} id - ID untuk divalidasi
 * @returns {boolean}
 */
function isValidId(id) {
  const num = parseInt(id, 10);
  return !isNaN(num) && num > 0;
}

/**
 * Extract dan validasi ID dari parameter URL
 * Mengembalikan ID jika valid, atau null jika invalid
 * @param {string|number} id - ID untuk divalidasi
 * @returns {number|null}
 */
function extractValidId(id) {
  if (!isValidId(id)) return null;
  return parseInt(id, 10);
}

export { isValidId, extractValidId };
