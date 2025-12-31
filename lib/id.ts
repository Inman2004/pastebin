import { randomBytes } from 'crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

export function generateId(length: number = 10): string {
  if (length <= 0) return '';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    // & 63 is equivalent to % 64
    const index = bytes[i] & 63;
    result += ALPHABET[index];
  }
  return result;
}
