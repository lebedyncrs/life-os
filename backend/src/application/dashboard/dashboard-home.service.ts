import { Injectable } from '@nestjs/common';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { BirthdayRepository } from '../birthdays/birthday.repository';
import { FailedReminderCounterPort } from './failed-reminder-counter.port';
import { IdeaRepository } from '../ideas/idea.repository';
import { ShoppingRepository } from '../shopping/shopping.repository';
import { TrainingRepository } from '../habits/training.repository';

@Injectable()
export class DashboardHomeService {
  constructor(
    private readonly shopping: ShoppingRepository,
    private readonly ideas: IdeaRepository,
    private readonly birthdays: BirthdayRepository,
    private readonly training: TrainingRepository,
    private readonly failedReminders: FailedReminderCounterPort,
  ) {}

  async buildHome(ownerId: string, week?: string) {
    const weekStart = week ? parseISO(week) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const [shoppingRows, ideaRows, birthdayRows, trainingCount, failedScheduledNotifications] = await Promise.all([
      this.shopping.listByOwner(ownerId),
      this.ideas.listByOwner(ownerId),
      this.birthdays.listByOwner(ownerId),
      this.training.countSessionsBetween(ownerId, weekStart, weekEnd),
      this.failedReminders.countFailedForOwner(ownerId),
    ]);

    return {
      shopping_items: shoppingRows.map((item) => ({
        id: item.id,
        title: item.title,
        is_done: item.isDone,
        source: item.source,
        created_at: item.createdAt.toISOString(),
      })),
      ideas: ideaRows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        created_at: row.createdAt.toISOString(),
      })),
      birthdays: birthdayRows.map((r) => ({
        id: r.id,
        person_name: r.personName,
        next_occurrence_on: r.nextOccurrenceOn.toISOString().slice(0, 10),
        lead_days: r.leadDays,
      })),
      habit_week: {
        week_start: format(weekStart, 'yyyy-MM-dd'),
        training_count: trainingCount,
      },
      failed_scheduled_notifications: failedScheduledNotifications,
    };
  }
}
