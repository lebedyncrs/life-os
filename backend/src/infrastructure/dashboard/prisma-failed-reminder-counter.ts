import { Injectable } from '@nestjs/common';
import { ScheduledNotificationStatus } from '@prisma/client';
import { FailedReminderCounterPort } from '../../application/dashboard/failed-reminder-counter.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaFailedReminderCounter extends FailedReminderCounterPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async countFailedForOwner(ownerId: string): Promise<number> {
    return this.prisma.scheduledNotification.count({
      where: { ownerId, status: ScheduledNotificationStatus.failed },
    });
  }
}
