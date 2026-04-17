import type { Owner } from '@prisma/client';

export abstract class OwnerReadRepository {
  abstract findByTelegramChatId(chatId: bigint): Promise<Owner | null>;
  abstract findByLinkToken(token: string): Promise<Owner | null>;
  abstract clearLinkTokenAndSetChat(ownerId: string, chatId: bigint): Promise<Owner>;
}
