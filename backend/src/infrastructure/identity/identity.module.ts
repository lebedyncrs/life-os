import { Module } from '@nestjs/common';
import { VerifyTelegramChatUseCase } from '../../application/identity/verify-telegram-chat.use-case';
import { OwnerReadRepository } from '../../application/ports/owner-read.repository';
import { PrismaOwnerReadRepository } from './prisma-owner-read.repository';
import { TelegramDevLinkService } from './telegram-dev-link.service';

@Module({
  providers: [
    VerifyTelegramChatUseCase,
    { provide: OwnerReadRepository, useClass: PrismaOwnerReadRepository },
    TelegramDevLinkService,
  ],
  exports: [VerifyTelegramChatUseCase, OwnerReadRepository],
})
export class IdentityModule {}
