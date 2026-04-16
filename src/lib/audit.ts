import { prisma } from "./prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "CANCEL" | "LOGIN";
export type AuditEntity = "Patient" | "Appointment" | "User";

export async function logAudit(
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error("Audit log error:", error);
  }
}
