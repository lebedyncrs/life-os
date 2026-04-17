import { Global, Module } from '@nestjs/common';
import { AuditLogger } from '../../application/ports/audit-logger.port';
import { PrismaAuditLogger } from './prisma-audit-logger.service';

@Global()
@Module({
  providers: [{ provide: AuditLogger, useClass: PrismaAuditLogger }],
  exports: [AuditLogger],
})
export class AuditModule {}
