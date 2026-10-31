import { randomBytes } from 'crypto';

const TRANSACTION_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NICKNAME_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateTransactionCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += TRANSACTION_ALPHABET[bytes[i]! % TRANSACTION_ALPHABET.length];
  }
  return code;
}

export function generateNickname(length = 8): string {
  const bytes = randomBytes(length);
  let nickname = '';
  for (let i = 0; i < length; i += 1) {
    nickname += NICKNAME_ALPHABET[bytes[i]! % NICKNAME_ALPHABET.length];
  }
  return nickname;
}

export function generateConfirmationCode(length = 6): string {
  const max = 10 ** length;
  const num = randomBytes(4).readUInt32BE(0) % max;
  return num.toString().padStart(length, '0');
}
