import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { TrainingRepository } from '../../../application/habits/training.repository';
import { CurrentOwnerId } from '../auth/current-owner.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';

@Controller('habits')
@UseGuards(SessionAuthGuard)
export class HabitsController {
  constructor(private readonly training: TrainingRepository) {}

  @Get('summary')
  async summary(@CurrentOwnerId() ownerId: string, @Query('week') week?: string) {
    const weekStart = week ? parseISO(week) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const count = await this.training.countSessionsBetween(ownerId, weekStart, weekEnd);
    return {
      week_start: format(weekStart, 'yyyy-MM-dd'),
      training_count: count,
    };
  }

  @Post('training-sessions')
  @HttpCode(201)
  async log(@CurrentOwnerId() ownerId: string, @Body() dto: CreateTrainingSessionDto): Promise<void> {
    const occurredOn = parseISO(dto.occurred_on);
    await this.training.logSession(ownerId, occurredOn, dto.label ?? 'training');
  }
}
