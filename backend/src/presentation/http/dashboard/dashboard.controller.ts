import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardHomeService } from '../../../application/dashboard/dashboard-home.service';
import { CurrentOwnerId } from '../auth/current-owner.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';

@Controller('dashboard')
@UseGuards(SessionAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardHomeService) {}

  @Get('home')
  async home(@CurrentOwnerId() ownerId: string, @Query('week') week?: string) {
    return this.dashboard.buildHome(ownerId, week);
  }
}
