import { Module } from '@nestjs/common';
import { DashboardHomeService } from '../../application/dashboard/dashboard-home.service';
import { FailedReminderCounterPort } from '../../application/dashboard/failed-reminder-counter.port';
import { BirthdaysModule } from '../birthdays/birthdays.module';
import { HabitsModule } from '../habits/habits.module';
import { IdeasModule } from '../ideas/ideas.module';
import { ShoppingModule } from '../shopping/shopping.module';
import { PrismaFailedReminderCounter } from './prisma-failed-reminder-counter';

@Module({
  imports: [ShoppingModule, IdeasModule, BirthdaysModule, HabitsModule],
  providers: [{ provide: FailedReminderCounterPort, useClass: PrismaFailedReminderCounter }, DashboardHomeService],
  exports: [DashboardHomeService],
})
export class DashboardModule {}
