import { Module } from '@nestjs/common';
import { RecordBirthdayFromTelegramUseCase } from '../../application/birthdays/record-birthday-from-telegram.use-case';
import { NotificationSchedulerPort } from '../../application/birthdays/notification-scheduler.port';
import { BirthdayRepository } from '../../application/birthdays/birthday.repository';
import { IdentityModule } from '../identity/identity.module';
import { RemindersModule } from '../jobs/reminders.module';
import { PgBossNotificationScheduler } from './pg-boss-notification-scheduler.adapter';
import { PrismaBirthdayRepository } from './prisma-birthday.repository';

@Module({
  imports: [IdentityModule, RemindersModule],
  providers: [
    { provide: BirthdayRepository, useClass: PrismaBirthdayRepository },
    { provide: NotificationSchedulerPort, useClass: PgBossNotificationScheduler },
    RecordBirthdayFromTelegramUseCase,
  ],
  exports: [BirthdayRepository, RecordBirthdayFromTelegramUseCase, NotificationSchedulerPort],
})
export class BirthdaysModule {}
