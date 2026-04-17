import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';

/**
 * When TELEGRAM_CHAT_ID is set (dev convenience), assigns it to the first Owner row
 * so you can skip /start linking for local testing.
 */
@Injectable()
export class TelegramDevLinkService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramDevLinkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const raw = this.config.get('TELEGRAM_CHAT_ID', { infer: true });
    if (!raw) {
      return;
    }
    const chatId = BigInt(raw.trim());
    const owner = await this.prisma.owner.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!owner) {
      this.logger.warn('TELEGRAM_CHAT_ID is set but no Owner exists — run npm run bootstrap:owner first');
      return;
    }
    await this.prisma.owner.update({
      where: { id: owner.id },
      data: {
        telegramChatId: chatId,
        telegramLinkToken: null,
      },
    });
    this.logger.log(`Linked Telegram chat id ${raw} to owner ${owner.email}`);
  }
}
