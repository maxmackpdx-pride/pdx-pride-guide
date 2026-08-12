import crypto from "node:crypto";

const LEGACY_PASSWORD_SALT = "pdxpride_salt";
const SCRYPT_HASH_PREFIX = "$scrypt$";

function legacyPasswordHash(password: string): string {
  return crypto.createHash("sha256").update(password + LEGACY_PASSWORD_SALT).digest("hex");
}

export function isLegacyPasswordHash(stored: string): boolean {
  return !stored.startsWith(SCRYPT_HASH_PREFIX);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${SCRYPT_HASH_PREFIX}${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith(SCRYPT_HASH_PREFIX)) {
    const payload = stored.slice(SCRYPT_HASH_PREFIX.length);
    const [saltHex, hashHex] = payload.split(":");
    if (!saltHex || !hashHex) return false;
    const derived = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  }

  const legacy = legacyPasswordHash(password);
  if (legacy.length !== stored.length) return false;
  return crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
}
