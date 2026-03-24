import { randomBytes } from 'crypto';
import { getChatByInviteToken } from './blob';

const INVITE_TOKEN_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const INVITE_TOKEN_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

function randomInviteToken(length: number) {
  const bytes = randomBytes(length);
  let token = '';

  for (const byte of bytes) {
    token += INVITE_TOKEN_ALPHABET[byte % INVITE_TOKEN_ALPHABET.length];
  }

  return token;
}

export async function generateInviteToken() {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const token = randomInviteToken(INVITE_TOKEN_LENGTH);
    const existing = await getChatByInviteToken(token);

    if (!existing) {
      return token;
    }
  }

  throw new Error('Failed to generate a unique invite token');
}
