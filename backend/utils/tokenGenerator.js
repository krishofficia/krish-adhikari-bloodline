const crypto = require('crypto');

/**
 * Generate a secure random token for password reset
 * @returns {string} - Secure random token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a SHA256 hash of a token for database storage
 * @param {string} token - The token to hash
 * @returns {string} - SHA256 hash of the token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify a token against its hash
 * @param {string} token - The token to verify
 * @param {string} hashedToken - The stored hash to verify against
 * @returns {boolean} - True if token matches hash
 */
const verifyToken = (token, hashedToken) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === hashedToken;
};

module.exports = {
  generateResetToken,
  hashToken,
  verifyToken
};
