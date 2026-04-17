import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './infrastructure/config/env.schema';
import { AuditModule } from './infrastructure/audit/audit.module';
import { IdentityModule } from './infrastructure/identity/identity.module';
import { PgBossModule } from './infrastructure/jobs/pg-boss.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './presentation/http/auth/auth.module';
import { HealthController } from './presentation/http/health.controller';
import { TelegramModule } from './presentation/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: (config: Record<string, unknown>) => envSchema.parse(config),
    }),
    PrismaModule,
    PgBossModule,
    AuditModule,
    IdentityModule,
    AuthModule,
    TelegramModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
