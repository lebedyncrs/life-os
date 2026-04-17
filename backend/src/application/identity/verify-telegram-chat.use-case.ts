import { Injectable } from '@nestjs/common';
import type { Owner } from '@prisma/client';
import { OwnerReadRepository } from '../ports/owner-read.repository';

@Injectable()
export class VerifyTelegramChatUseCase {
  constructor(private readonly owners: OwnerReadRepository) {}

  async findOwnerByLinkedChat(chatId: bigint): Promise<Owner | null> {
    return this.owners.findByTelegramChatId(chatId);
  }

  async linkChatWithToken(chatId: bigint, token: string): Promise<Owner | null> {
    const trimmed = token.trim();
    if (!trimmed) {
      return null;
    }
    const owner = await this.owners.findByLinkToken(trimmed);
    if (!owner) {
      return null;
    }
    return this.owners.clearLinkTokenAndSetChat(owner.id, chatId);
  }

  isLinkedOwner(owner: Pick<Owner, 'telegramChatId'>, chatId: bigint): boolean {
    return owner.telegramChatId !== null && owner.telegramChatId === chatId;
  }
}
