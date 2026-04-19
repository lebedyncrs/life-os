import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './infrastructure/config/env.schema';
import { AuditModule } from './infrastructure/audit/audit.module';
import { IdentityModule } from './infrastructure/identity/identity.module';
import { PgBossModule } from './infrastructure/jobs/pg-boss.module';
import { RemindersModule } from './infrastructure/jobs/reminders.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { TelegramCoreModule } from './infrastructure/telegram/telegram-core.module';
import { AuthModule } from './presentation/http/auth/auth.module';
import { BirthdaysHttpModule } from './presentation/http/birthdays/birthdays-http.module';
import { DashboardHttpModule } from './presentation/http/dashboard/dashboard-http.module';
import { HabitsHttpModule } from './presentation/http/habits/habits-http.module';
import { HealthController } from './presentation/http/health.controller';
import { IdeasHttpModule } from './presentation/http/ideas/ideas-http.module';
import { ShoppingHttpModule } from './presentation/http/shopping/shopping-http.module';
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
    TelegramCoreModule,
    RemindersModule,
    AuditModule,
    IdentityModule,
    AuthModule,
    TelegramModule,
    ShoppingHttpModule,
    IdeasHttpModule,
    BirthdaysHttpModule,
    HabitsHttpModule,
    DashboardHttpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
