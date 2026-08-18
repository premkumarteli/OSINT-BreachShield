const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env in services/api-gateway
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret || typeof rawSecret !== 'string' || rawSecret.trim().length < 32) {
  throw new Error(
    `[Config Error] JWT_SECRET must be set in environment variables and be at least 32 characters long. ` +
    `Received: ${rawSecret ? `${rawSecret.length} chars` : 'undefined'}`
  );
}

const JWT_SECRET = rawSecret.trim();

module.exports = {
  JWT_SECRET
};
