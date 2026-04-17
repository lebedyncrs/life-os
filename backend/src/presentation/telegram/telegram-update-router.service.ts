import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Bot, Context } from 'grammy';
import { VerifyTelegramChatUseCase } from '../../application/identity/verify-telegram-chat.use-case';
import type { Env } from '../../infrastructure/config/env.schema';

@Injectable()
export class TelegramUpdateRouterService implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdateRouterService.name);

  constructor(
    private readonly bot: Bot,
    private readonly verifyTelegram: VerifyTelegramChatUseCase,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    this.bot.on('message', (ctx) => {
      void this.handleMessage(ctx);
    });
  }

  private async handleMessage(ctx: Context): Promise<void> {
    const msg = ctx.message;
    if (!msg || !('chat' in msg) || !msg.chat) {
      return;
    }
    const chatId = BigInt(msg.chat.id);

    if ('text' in msg && typeof msg.text === 'string' && msg.text.startsWith('/start')) {
      const parts = msg.text.split(/\s+/);
      const token = parts[1] ?? '';
      const linked = await this.verifyTelegram.linkChatWithToken(chatId, token);
      if (linked) {
        await ctx.reply('Telegram linked to your Life OS account.');
        return;
      }
      await ctx.reply('Invalid or expired link token. Copy the token from your setup email or dashboard.');
      return;
    }

    const owner = await this.verifyTelegram.findOwnerByLinkedChat(chatId);
    if (!owner || !this.verifyTelegram.isLinkedOwner(owner, chatId)) {
      await ctx.reply('Send /start <your-link-token> to connect this chat to Life OS.');
      return;
    }

    this.logger.debug(`Bound message from owner=${owner.id} chat=${chatId}`);
    await ctx.reply('Linked. Shopping and ideas capture will arrive in the next tasks (US1+).');
  }
}
