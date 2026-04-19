import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Bot } from 'grammy';
import { ScheduledNotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PgBossService } from './pg-boss.service';
import { TELEGRAM_REMINDER_QUEUE, type TelegramReminderJobData } from './reminder-queue.service';

const LAST_ERR_MAX = 1900;

@Injectable()
export class SendTelegramReminderHandler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SendTelegramReminderHandler.name);

  constructor(
    private readonly pgBoss: PgBossService,
    private readonly prisma: PrismaService,
    @Inject(Bot) private readonly bot: Bot,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const boss = this.pgBoss.getBoss();
    await boss.work(TELEGRAM_REMINDER_QUEUE, { batchSize: 1 }, async (jobs) => {
      for (const job of jobs) {
        const data = job.data as TelegramReminderJobData;
        await this.handleJob(data.scheduledNotificationId);
      }
    });
    this.logger.log(`pg-boss worker registered for queue "${TELEGRAM_REMINDER_QUEUE}"`);
  }

  private async handleJob(scheduledNotificationId: string): Promise<void> {
    const row = await this.prisma.scheduledNotification.findUnique({
      where: { id: scheduledNotificationId },
      include: { owner: true, birthdayReminder: true },
    });
    if (!row) {
      this.logger.warn(`ScheduledNotification missing id=${scheduledNotificationId}`);
      return;
    }
    if (row.status !== ScheduledNotificationStatus.pending) {
      return;
    }

    const locked = await this.prisma.scheduledNotification.updateMany({
      where: { id: scheduledNotificationId, status: ScheduledNotificationStatus.pending },
      data: { status: ScheduledNotificationStatus.sending },
    });
    if (locked.count === 0) {
      return;
    }

    const chatId = row.owner.telegramChatId;
    if (chatId === null) {
      await this.markFailed(scheduledNotificationId, 'Telegram not linked for owner');
      return;
    }

    const person = row.birthdayReminder?.personName ?? 'Reminder';
    const when = row.birthdayReminder?.nextOccurrenceOn
      ? row.birthdayReminder.nextOccurrenceOn.toISOString().slice(0, 10)
      : 'soon';
    const text = `Life OS: upcoming birthday for ${person} (${when}).`;

    try {
      await this.bot.api.sendMessage(Number(chatId), text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.markFailed(scheduledNotificationId, msg);
      return;
    }

    await this.prisma.scheduledNotification.update({
      where: { id: scheduledNotificationId },
      data: {
        status: ScheduledNotificationStatus.sent,
        sentAt: new Date(),
        lastError: null,
      },
    });
  }

  private async markFailed(id: string, err: string): Promise<void> {
    await this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        status: ScheduledNotificationStatus.failed,
        lastError: err.slice(0, LAST_ERR_MAX),
      },
    });
  }
}
