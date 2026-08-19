const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from root .env or services/api-gateway/.env
const rootEnv = path.resolve(__dirname, '..', '..', '..', '.env');
const localEnv = path.resolve(__dirname, '..', '.env');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else {
  dotenv.config();
}

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
