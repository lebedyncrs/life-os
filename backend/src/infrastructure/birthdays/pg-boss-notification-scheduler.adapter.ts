import { Injectable } from '@nestjs/common';
import { NotificationSchedulerPort } from '../../application/birthdays/notification-scheduler.port';
import { ReminderQueueService } from '../jobs/reminder-queue.service';

@Injectable()
export class PgBossNotificationScheduler extends NotificationSchedulerPort {
  constructor(private readonly queue: ReminderQueueService) {
    super();
  }

  async scheduleTelegramReminder(scheduledNotificationId: string, fireAt: Date): Promise<void> {
    await this.queue.enqueueTelegramReminder(scheduledNotificationId, fireAt);
  }
}
