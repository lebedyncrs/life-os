import { Injectable } from '@nestjs/common';
import { NotificationChannel, ScheduledNotificationStatus } from '@prisma/client';
import {
  BirthdayRepository,
  type BirthdayListRow,
  type UpsertBirthdayInput,
} from '../../application/birthdays/birthday.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaBirthdayRepository extends BirthdayRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async upsertReminder(ownerId: string, input: UpsertBirthdayInput): Promise<{ id: string; nextOccurrenceOn: Date }> {
    const personName = input.personName.trim();
    const existing = await this.prisma.birthdayReminder.findFirst({
      where: {
        ownerId,
        personName: { equals: personName, mode: 'insensitive' },
      },
    });

    const row = existing
      ? await this.prisma.birthdayReminder.update({
          where: { id: existing.id },
          data: {
            personName,
            nextOccurrenceOn: input.nextOccurrenceOn,
            originalYearKnown: input.originalYearKnown,
            leadDays: input.leadDays,
            notes: input.notes,
          },
        })
      : await this.prisma.birthdayReminder.create({
          data: {
            ownerId,
            personName,
            nextOccurrenceOn: input.nextOccurrenceOn,
            originalYearKnown: input.originalYearKnown,
            leadDays: input.leadDays,
            notes: input.notes,
          },
        });

    return { id: row.id, nextOccurrenceOn: row.nextOccurrenceOn };
  }

  async listByOwner(ownerId: string): Promise<BirthdayListRow[]> {
    const rows = await this.prisma.birthdayReminder.findMany({
      where: { ownerId },
      orderBy: { nextOccurrenceOn: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      personName: r.personName,
      nextOccurrenceOn: r.nextOccurrenceOn,
      leadDays: r.leadDays,
      notes: r.notes,
    }));
  }

  async replacePendingTelegramNotification(
    ownerId: string,
    birthdayReminderId: string,
    data: { fireAt: Date; idempotencyKey: string },
  ): Promise<{ scheduledNotificationId: string }> {
    await this.prisma.scheduledNotification.deleteMany({
      where: {
        birthdayReminderId,
        status: {
          in: [
            ScheduledNotificationStatus.pending,
            ScheduledNotificationStatus.failed,
            ScheduledNotificationStatus.cancelled,
          ],
        },
      },
    });
    const row = await this.prisma.scheduledNotification.create({
      data: {
        ownerId,
        birthdayReminderId,
        fireAt: data.fireAt,
        channel: NotificationChannel.telegram,
        status: ScheduledNotificationStatus.pending,
        idempotencyKey: data.idempotencyKey,
      },
    });
    return { scheduledNotificationId: row.id };
  }
}
