import { Injectable } from '@nestjs/common';
import { TrainingSessionSource } from '@prisma/client';
import { TrainingRepository } from '../../application/habits/training.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTrainingRepository extends TrainingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async countSessionsBetween(ownerId: string, startInclusive: Date, endInclusive: Date): Promise<number> {
    return this.prisma.trainingSession.count({
      where: {
        ownerId,
        occurredOn: { gte: startInclusive, lte: endInclusive },
      },
    });
  }

  async logSession(ownerId: string, occurredOn: Date, label: string): Promise<void> {
    await this.prisma.trainingSession.create({
      data: {
        ownerId,
        occurredOn,
        label: label.slice(0, 100),
        source: TrainingSessionSource.dashboard,
      },
    });
  }
}
