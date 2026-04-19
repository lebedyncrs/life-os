import { Module } from '@nestjs/common';
import { TrainingRepository } from '../../application/habits/training.repository';
import { PrismaTrainingRepository } from './prisma-training.repository';

@Module({
  providers: [{ provide: TrainingRepository, useClass: PrismaTrainingRepository }],
  exports: [TrainingRepository],
})
export class HabitsModule {}
