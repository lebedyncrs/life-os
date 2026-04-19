import { Injectable } from '@nestjs/common';
import { AuditChannel } from '@prisma/client';
import { format } from 'date-fns';
import { isSetBirthdayReminder, type ParsedCommand } from '../nlu/nlu.types';
import { AuditLogger } from '../ports/audit-logger.port';
import { OwnerReadRepository } from '../ports/owner-read.repository';
import { BirthdayRepository } from './birthday.repository';
import { computeBirthdayReminderFireAt } from './birthday-fire-at';
import { NotificationSchedulerPort } from './notification-scheduler.port';

export type RecordBirthdayOutcome =
  | { kind: 'saved'; personName: string; nextOccurrenceOn: string }
  | { kind: 'unknown'; command: ParsedCommand };

@Injectable()
export class RecordBirthdayFromTelegramUseCase {
  constructor(
    private readonly owners: OwnerReadRepository,
    private readonly birthdays: BirthdayRepository,
    private readonly scheduler: NotificationSchedulerPort,
    private readonly audit: AuditLogger,
  ) {}

  async executeFromParsed(ownerId: string, cmd: ParsedCommand): Promise<RecordBirthdayOutcome> {
    if (!isSetBirthdayReminder(cmd)) {
      return { kind: 'unknown', command: cmd };
    }

    const owner = await this.owners.findById(ownerId);
    if (!owner) {
      return { kind: 'unknown', command: { intent: 'UNKNOWN', reason: 'other' } };
    }

    const p = cmd.payload;
    const nextDate = new Date(`${p.nextOccurrenceOn}T00:00:00.000Z`);

    const { id: birthdayId, nextOccurrenceOn } = await this.birthdays.upsertReminder(ownerId, {
      personName: p.personName,
      nextOccurrenceOn: nextDate,
      originalYearKnown: p.originalYearKnown,
      leadDays: p.leadDays,
      notes: p.notes ?? null,
    });

    const ymd = format(nextOccurrenceOn, 'yyyy-MM-dd');
    const idempotencyKey = `birthday:${birthdayId}:${ymd}`.slice(0, 500);
    const fireAt = computeBirthdayReminderFireAt(ymd, p.leadDays, owner.timezone);

    const { scheduledNotificationId } = await this.birthdays.replacePendingTelegramNotification(ownerId, birthdayId, {
      fireAt,
      idempotencyKey,
    });

    await this.scheduler.scheduleTelegramReminder(scheduledNotificationId, fireAt);

    await this.audit.log({
      ownerId,
      action: 'birthday.upsert',
      entityType: 'BirthdayReminder',
      entityId: birthdayId,
      channel: AuditChannel.telegram,
      metadata: {
        personNameLen: p.personName.length,
        nextOccurrenceOn: ymd,
        leadDays: p.leadDays,
      },
    });

    return { kind: 'saved', personName: p.personName.trim(), nextOccurrenceOn: ymd };
  }
}
