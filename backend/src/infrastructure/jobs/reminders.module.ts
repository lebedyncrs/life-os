import { Module } from '@nestjs/common';
import { TelegramCoreModule } from '../telegram/telegram-core.module';
import { PgBossModule } from './pg-boss.module';
import { ReminderQueueService } from './reminder-queue.service';
import { SendTelegramReminderHandler } from './send-telegram-reminder.handler';

@Module({
  imports: [PgBossModule, TelegramCoreModule],
  providers: [ReminderQueueService, SendTelegramReminderHandler],
  exports: [ReminderQueueService],
})
export class RemindersModule {}
