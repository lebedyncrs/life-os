import { Controller, Get, UseGuards } from '@nestjs/common';
import { BirthdayRepository } from '../../../application/birthdays/birthday.repository';
import { CurrentOwnerId } from '../auth/current-owner.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';

@Controller('birthdays')
@UseGuards(SessionAuthGuard)
export class BirthdaysController {
  constructor(private readonly birthdays: BirthdayRepository) {}

  @Get()
  async list(@CurrentOwnerId() ownerId: string) {
    const rows = await this.birthdays.listByOwner(ownerId);
    return rows.map((r) => ({
      id: r.id,
      person_name: r.personName,
      next_occurrence_on: r.nextOccurrenceOn.toISOString().slice(0, 10),
      lead_days: r.leadDays,
    }));
  }
}
