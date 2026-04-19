import { Module } from '@nestjs/common';
import { BirthdaysModule } from '../../../infrastructure/birthdays/birthdays.module';
import { AuthModule } from '../auth/auth.module';
import { BirthdaysController } from './birthdays.controller';

@Module({
  imports: [AuthModule, BirthdaysModule],
  controllers: [BirthdaysController],
})
export class BirthdaysHttpModule {}
