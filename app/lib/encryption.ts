import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * 비밀번호 기반 키 생성 (PBKDF2)
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * AES-256-GCM 암호화
 * @param text 암호화할 평문
 * @param key 암호화 키 (비밀번호)
 * @returns Base64 인코딩된 암호문 (salt + iv + authTag + encrypted)
 */
export function encrypt(text: string, key: string): string {
  // 랜덤 salt 생성
  const salt = crypto.randomBytes(SALT_LENGTH);

  // 키 유도
  const derivedKey = deriveKey(key, salt);

  // 랜덤 IV 생성
  const iv = crypto.randomBytes(IV_LENGTH);

  // 암호화
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  // 인증 태그 가져오기
  const authTag = cipher.getAuthTag();

  // salt + iv + authTag + encrypted 결합
  const result = Buffer.concat([salt, iv, authTag, encrypted]);

  return result.toString('base64');
}

/**
 * AES-256-GCM 복호화
 * @param encrypted Base64 인코딩된 암호문
 * @param key 복호화 키 (비밀번호)
 * @returns 복호화된 평문
 */
export function decrypt(encrypted: string, key: string): string {
  const buffer = Buffer.from(encrypted, 'base64');

  // 각 부분 추출
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encryptedText = buffer.subarray(
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );

  // 키 유도
  const derivedKey = deriveKey(key, salt);

  // 복호화
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * API 키 마스킹 (앞 4자리만 표시)
 * @param apiKey 마스킹할 API 키
 * @returns 마스킹된 API 키 (예: "sk-a****")
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 4) {
    return '****';
  }

  const visiblePart = apiKey.substring(0, 4);
  const maskedPart = '*'.repeat(Math.min(apiKey.length - 4, 20));

  return `${visiblePart}${maskedPart}`;
}
