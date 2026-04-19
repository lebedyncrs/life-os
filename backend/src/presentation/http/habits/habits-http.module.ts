import { Module } from '@nestjs/common';
import { HabitsModule } from '../../../infrastructure/habits/habits.module';
import { AuthModule } from '../auth/auth.module';
import { HabitsController } from './habits.controller';

@Module({
  imports: [AuthModule, HabitsModule],
  controllers: [HabitsController],
})
export class HabitsHttpModule {}
