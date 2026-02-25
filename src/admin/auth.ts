import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AdminJwtPayload {
  adminId: string;
  sessionId: string;
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, config.admin.jwtSecret, {
    expiresIn: config.admin.jwtExpiresIn,
  });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, config.admin.jwtSecret) as AdminJwtPayload;
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOtpViaTelegram(telegramId: bigint, code: string): Promise<void> {
  const text = `🔐 <b>Admin Login OTP</b>\n\nYour verification code:\n<code>${code}</code>\n\nExpires in 5 minutes.`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${config.bot.token}/sendMessage`,
      {
        chat_id: telegramId.toString(),
        text,
        parse_mode: 'HTML',
      }
    );
  } catch (err: any) {
    logger.error('Failed to send OTP via Telegram', { error: err.message });
    throw new Error('Failed to send verification code');
  }
}
