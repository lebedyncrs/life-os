import type { AuditChannel } from '@prisma/client';

export type AuditLogInput = {
  ownerId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  channel: AuditChannel;
  metadata: Record<string, unknown>;
};

export abstract class AuditLogger {
  abstract log(entry: AuditLogInput): Promise<void>;
}
