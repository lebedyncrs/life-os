import { Injectable } from '@nestjs/common';
import type { Owner } from '@prisma/client';
import { OwnerReadRepository } from '../../application/ports/owner-read.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaOwnerReadRepository extends OwnerReadRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByTelegramChatId(chatId: bigint): Promise<Owner | null> {
    return this.prisma.owner.findFirst({
      where: { telegramChatId: chatId },
    });
  }

  async findByLinkToken(token: string): Promise<Owner | null> {
    return this.prisma.owner.findFirst({
      where: { telegramLinkToken: token },
    });
  }

  async clearLinkTokenAndSetChat(ownerId: string, chatId: bigint): Promise<Owner> {
    await this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        telegramChatId: chatId,
        telegramLinkToken: null,
      },
    });
    return this.prisma.owner.findUniqueOrThrow({ where: { id: ownerId } });
  }
}
