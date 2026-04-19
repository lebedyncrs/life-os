import { Injectable } from '@nestjs/common';
import { PgBossService } from './pg-boss.service';

export const TELEGRAM_REMINDER_QUEUE = 'telegram-reminder';

export type TelegramReminderJobData = {
  scheduledNotificationId: string;
};

@Injectable()
export class ReminderQueueService {
  constructor(private readonly pgBoss: PgBossService) {}

  /** Enqueue a one-shot reminder job at `fireAt` (deduped per notification id). */
  async enqueueTelegramReminder(scheduledNotificationId: string, fireAt: Date): Promise<void> {
    const boss = this.pgBoss.getBoss();
    await boss.send(
      TELEGRAM_REMINDER_QUEUE,
      { scheduledNotificationId } satisfies TelegramReminderJobData,
      {
        startAfter: fireAt,
        singletonKey: scheduledNotificationId,
      },
    );
  }
}
