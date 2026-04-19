/** Schedules outbound reminder jobs (US3 producer / US5 consumer). */
export abstract class NotificationSchedulerPort {
  abstract scheduleTelegramReminder(scheduledNotificationId: string, fireAt: Date): Promise<void>;
}
