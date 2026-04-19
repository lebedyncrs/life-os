import { Module } from '@nestjs/common';
import { IdeasModule } from '../../../infrastructure/ideas/ideas.module';
import { AuthModule } from '../auth/auth.module';
import { IdeasController } from './ideas.controller';

@Module({
  imports: [AuthModule, IdeasModule],
  controllers: [IdeasController],
})
export class IdeasHttpModule {}
