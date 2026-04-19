import type { Owner } from '@prisma/client';

export abstract class OwnerReadRepository {
  abstract findById(ownerId: string): Promise<Owner | null>;
  abstract findByTelegramChatId(chatId: bigint): Promise<Owner | null>;
  abstract findByLinkToken(token: string): Promise<Owner | null>;
  abstract clearLinkTokenAndSetChat(ownerId: string, chatId: bigint): Promise<Owner>;
}
