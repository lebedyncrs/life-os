/**
 * Reminder delivery retry policy (US5 / constitution-aligned).
 *
 * **Current behavior**: `SendTelegramReminderHandler` performs a single send attempt
 * per job; failures mark `ScheduledNotification.status = failed` with truncated
 * `last_error`. Jobs are enqueued via {@link ReminderQueueService} without pg-boss
 * job-level retries to keep DB state authoritative.
 *
 * **Production extension**: set `retryLimit` / `retryDelay` on `boss.send` in
 * {@link ReminderQueueService} and distinguish transient Telegram errors (throw to
 * retry) from permanent ones (mark failed, complete job). Cap attempts at
 * {@link TELEGRAM_REMINDER_MAX_ATTEMPTS}.
 */
export const TELEGRAM_REMINDER_MAX_ATTEMPTS = 3;

export const TELEGRAM_REMINDER_RETRY_DELAY_SECONDS = 120;
