export type UpsertBirthdayInput = {
  personName: string;
  nextOccurrenceOn: Date;
  originalYearKnown: boolean;
  leadDays: number;
  notes: string | null;
};

export type BirthdayListRow = {
  id: string;
  personName: string;
  nextOccurrenceOn: Date;
  leadDays: number;
  notes: string | null;
};

export abstract class BirthdayRepository {
  abstract upsertReminder(ownerId: string, input: UpsertBirthdayInput): Promise<{ id: string; nextOccurrenceOn: Date }>;

  abstract listByOwner(ownerId: string): Promise<BirthdayListRow[]>;

  /** Clears pending Telegram rows for this birthday, inserts a new pending row, returns its id. */
  abstract replacePendingTelegramNotification(
    ownerId: string,
    birthdayReminderId: string,
    data: { fireAt: Date; idempotencyKey: string },
  ): Promise<{ scheduledNotificationId: string }>;
}
