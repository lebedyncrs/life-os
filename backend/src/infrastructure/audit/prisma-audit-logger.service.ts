import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogger, type AuditLogInput } from '../../application/ports/audit-logger.port';
import { PrismaService } from '../prisma/prisma.service';

const MAX_METADATA_BYTES = 2000;

@Injectable()
export class PrismaAuditLogger extends AuditLogger {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async log(entry: AuditLogInput): Promise<void> {
    const metadata = this.truncateMetadata(entry.metadata);
    await this.prisma.auditLog.create({
      data: {
        ownerId: entry.ownerId,
        action: entry.action.slice(0, 200),
        entityType: entry.entityType?.slice(0, 100) ?? null,
        entityId: entry.entityId ?? null,
        channel: entry.channel,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  private truncateMetadata(meta: Record<string, unknown>): Record<string, unknown> {
    const json = JSON.stringify(meta);
    if (json.length <= MAX_METADATA_BYTES) {
      return meta;
    }
    return { truncated: true, preview: json.slice(0, MAX_METADATA_BYTES) };
  }
}
