import { prisma } from '../config/database';

export async function logAudit(
  adminId: string,
  action: string,
  opts?: {
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType: opts?.targetType,
        targetId: opts?.targetId,
        details: opts?.details as any,
        ipAddress: opts?.ipAddress,
      },
    });
  } catch (err) {
    // Don't let audit failures break the main flow
    console.error('Failed to write audit log:', err);
  }
}
