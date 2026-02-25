import { redis } from '../config/redis';
import { config } from '../config';

const OTP_PREFIX = 'admin:otp:';
const BROADCAST_CANCEL_PREFIX = 'broadcast:cancel:';

export async function storeOtp(adminId: string, code: string): Promise<void> {
  await redis.set(`${OTP_PREFIX}${adminId}`, code, 'EX', config.admin.otpTtl);
}

export async function verifyOtp(adminId: string, code: string): Promise<boolean> {
  const stored = await redis.get(`${OTP_PREFIX}${adminId}`);
  if (stored === code) {
    await redis.del(`${OTP_PREFIX}${adminId}`);
    return true;
  }
  return false;
}

export async function setBroadcastCancel(broadcastId: string): Promise<void> {
  await redis.set(`${BROADCAST_CANCEL_PREFIX}${broadcastId}`, '1', 'EX', 3600);
}

export async function isBroadcastCancelled(broadcastId: string): Promise<boolean> {
  const val = await redis.get(`${BROADCAST_CANCEL_PREFIX}${broadcastId}`);
  return val === '1';
}
