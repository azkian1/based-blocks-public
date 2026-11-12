// Safe localStorage utilities
// Handles cases where localStorage is disabled or quota exceeded

/**
 * Safely get an item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Value to return if storage fails
 * @returns {string|null} The stored value or defaultValue
 */
export function safeGetItem(key, defaultValue = null) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Storage read failed for ${key}:`, e.message);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {boolean} true if successful, false otherwise
 */
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Storage write failed for ${key}:`, e.message);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} true if successful, false otherwise
 */
export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Storage remove failed for ${key}:`, e.message);
    return false;
  }
}
