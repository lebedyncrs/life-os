import { Module } from '@nestjs/common';
import { DashboardModule } from '../../../infrastructure/dashboard/dashboard.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AuthModule, DashboardModule],
  controllers: [DashboardController],
})
export class DashboardHttpModule {}
