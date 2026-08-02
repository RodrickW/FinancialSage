import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'mindmymoney-plaid-salt-v1';

function getDerivedKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY environment variable is required but not set. Set it in your Replit Secrets.');
  }
  // Derive a consistent 32-byte key regardless of the raw key length
  return crypto.scryptSync(raw, SALT, 32);
}

/**
 * Encrypt sensitive data before storing in database.
 * Output format: <ivHex>:<authTagHex>:<encryptedHex>
 */
export function encryptSensitiveData(text: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data from database.
 * Gracefully handles plaintext values (pre-migration tokens) by returning them as-is.
 */
export function decryptSensitiveData(encryptedData: string): string {
  const parts = encryptedData.split(':');

  // Encrypted format is always exactly 3 parts, IV is always 32 hex chars (16 bytes)
  if (parts.length !== 3 || parts[0].length !== 32) {
    // Treat as plaintext — token was stored before encryption was introduced
    return encryptedData;
  }

  try {
    const [ivHex, authTagHex, encrypted] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // Decryption failed — treat as plaintext (handles migration edge cases)
    return encryptedData;
  }
}

/**
 * Hash data for comparison (one-way)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
