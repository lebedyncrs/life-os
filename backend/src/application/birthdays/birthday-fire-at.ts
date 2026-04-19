import { format, parseISO, subDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

/** 09:00 local on the calendar day `leadDays` before the next celebration. */
export function computeBirthdayReminderFireAt(
  nextOccurrenceOnYmd: string,
  leadDays: number,
  ownerTimezone: string,
): Date {
  const next = parseISO(nextOccurrenceOnYmd);
  const remindDay = subDays(next, leadDays);
  const dayStr = format(remindDay, 'yyyy-MM-dd');
  return fromZonedTime(`${dayStr}T09:00:00`, ownerTimezone);
}
