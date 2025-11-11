/**
 * In-memory token blacklist for logout
 * For production, use Redis
 */

const blacklistedTokens = new Set();

export function addToBlacklist(token) {
  blacklistedTokens.add(token);
}

export function isBlacklisted(token) {
  return blacklistedTokens.has(token);
}

export function removeFromBlacklist(token) {
  blacklistedTokens.delete(token);
}

export function clearBlacklist() {
  blacklistedTokens.clear();
}

export function getBlacklistSize() {
  return blacklistedTokens.size;
}
