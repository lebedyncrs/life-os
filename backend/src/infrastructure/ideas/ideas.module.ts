import { Module } from '@nestjs/common';
import { SaveIdeaFromTelegramUseCase } from '../../application/ideas/save-idea-from-telegram.use-case';
import { IdeaRepository } from '../../application/ideas/idea.repository';
import { PrismaIdeaRepository } from './prisma-idea.repository';

@Module({
  providers: [{ provide: IdeaRepository, useClass: PrismaIdeaRepository }, SaveIdeaFromTelegramUseCase],
  exports: [SaveIdeaFromTelegramUseCase, IdeaRepository],
})
export class IdeasModule {}
