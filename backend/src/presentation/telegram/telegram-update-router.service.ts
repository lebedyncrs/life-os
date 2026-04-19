import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ShoppingListItemSource } from '@prisma/client';
import { Bot } from 'grammy';
import type { Context } from 'grammy';
import { RecordBirthdayFromTelegramUseCase } from '../../application/birthdays/record-birthday-from-telegram.use-case';
import { SaveIdeaFromTelegramUseCase } from '../../application/ideas/save-idea-from-telegram.use-case';
import { VerifyTelegramChatUseCase } from '../../application/identity/verify-telegram-chat.use-case';
import { isSaveIdea, isSetBirthdayReminder, type ParsedCommand } from '../../application/nlu/nlu.types';
import { NluPort } from '../../application/ports/nlu.port';
import { CaptureShoppingFromTelegramUseCase } from '../../application/shopping/capture-shopping-from-telegram.use-case';
import { VoiceIngestService } from './voice-ingest.service';

@Injectable()
export class TelegramUpdateRouterService implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdateRouterService.name);

  constructor(
    @Inject(Bot) private readonly bot: Bot,
    private readonly verifyTelegram: VerifyTelegramChatUseCase,
    private readonly nlu: NluPort,
    private readonly captureShopping: CaptureShoppingFromTelegramUseCase,
    private readonly saveIdea: SaveIdeaFromTelegramUseCase,
    private readonly recordBirthday: RecordBirthdayFromTelegramUseCase,
    private readonly voiceIngest: VoiceIngestService,
  ) {}

  onModuleInit(): void {
    this.bot.on('message', (ctx) => {
      void this.handleMessage(ctx).catch((err: unknown) => {
        this.logger.error(
          `handleMessage failed chat=${ctx.chat?.id}: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
        void ctx
          .reply('Sorry — something went wrong. Try again, or send your list as text.')
          .catch(() => undefined);
      });
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

    if ('text' in msg && typeof msg.text === 'string') {
      const text = msg.text.trim();
      if (text.startsWith('/')) {
        await ctx.reply(
          'Unknown command. Send shopping items as plain text (e.g. "milk, eggs") or an idea with e.g. "save this idea: …".',
        );
        return;
      }
      if (!text) {
        return;
      }

      const cmd = await this.nlu.parseTelegramText({ text, ownerTimezone: owner.timezone });
      if (isSaveIdea(cmd)) {
        const ideaOutcome = await this.saveIdea.executeFromParsed(owner.id, cmd);
        if (ideaOutcome.kind === 'saved') {
          await ctx.reply('Idea saved.');
          return;
        }
        await ctx.reply(this.emptyOrUnknownIdeaReply(ideaOutcome.command));
        return;
      }
      if (isSetBirthdayReminder(cmd)) {
        const b = await this.recordBirthday.executeFromParsed(owner.id, cmd);
        if (b.kind === 'saved') {
          await ctx.reply(`Birthday reminder saved for ${b.personName} (next: ${b.nextOccurrenceOn}).`);
          return;
        }
        await ctx.reply(this.unknownBirthdayReply(b.command));
        return;
      }

      const outcome = await this.captureShopping.executeFromParsed(owner.id, cmd, ShoppingListItemSource.telegram_text);
      if (outcome.kind === 'added') {
        if (outcome.count === 0) {
          await ctx.reply('No items were added. Try rephrasing.');
        } else if (outcome.titles.length <= 5) {
          await ctx.reply(`Added: ${outcome.titles.join(', ')}`);
        } else {
          await ctx.reply(`Added ${outcome.count} items.`);
        }
        return;
      }

      await ctx.reply(this.unknownShoppingReply(outcome.command));
      return;
    }

    const isVoice = 'voice' in msg && msg.voice;
    const isShortAudio =
      'audio' in msg && msg.audio && msg.audio.duration && msg.audio.duration > 0 && msg.audio.duration <= 600;
    if (isVoice || isShortAudio) {
      const transcript = await this.voiceIngest.transcribeVoiceMessage(ctx);
      if (!transcript) {
        await ctx.reply("Couldn't understand the voice note — try again or type the items.");
        return;
      }

      const cmd = await this.nlu.parseTelegramVoiceTranscript({ transcript, ownerTimezone: owner.timezone });
      if (isSaveIdea(cmd)) {
        const ideaOutcome = await this.saveIdea.executeFromParsed(owner.id, cmd);
        if (ideaOutcome.kind === 'saved') {
          await ctx.reply('Idea saved from your voice note.');
          return;
        }
        await ctx.reply(this.emptyOrUnknownIdeaReply(ideaOutcome.command));
        return;
      }
      if (isSetBirthdayReminder(cmd)) {
        const b = await this.recordBirthday.executeFromParsed(owner.id, cmd);
        if (b.kind === 'saved') {
          await ctx.reply(`Birthday reminder saved for ${b.personName} (next: ${b.nextOccurrenceOn}).`);
          return;
        }
        await ctx.reply(this.unknownBirthdayReply(b.command));
        return;
      }

      const outcome = await this.captureShopping.executeFromParsed(
        owner.id,
        cmd,
        ShoppingListItemSource.telegram_voice,
      );
      if (outcome.kind === 'added') {
        if (outcome.count === 0) {
          await ctx.reply('No items were added from that voice note. Try again with clearer names.');
        } else if (outcome.titles.length <= 5) {
          await ctx.reply(`Added: ${outcome.titles.join(', ')}`);
        } else {
          await ctx.reply(`Added ${outcome.count} items.`);
        }
        return;
      }

      await ctx.reply(this.unknownShoppingReply(outcome.command));
      return;
    }

    this.logger.debug(`Bound message from owner=${owner.id} chat=${chatId} (no text/voice handler)`);
    await ctx.reply(
      'Send text or a voice note for shopping, ideas ("save this idea: …"), or birthday reminders (e.g. "remind me … birthday").',
    );
  }

  private unknownBirthdayReply(command: ParsedCommand): string {
    if (command.intent === 'UNKNOWN' && command.reason === 'ambiguous') {
      return 'Could not parse that birthday reminder. Try a person name and a clear date.';
    }
    return 'Could not save a birthday reminder from that. Try rephrasing with who and when.';
  }

  private emptyOrUnknownIdeaReply(command: ParsedCommand): string {
    if (command.intent === 'UNKNOWN' && command.reason === 'empty') {
      return 'Add some text after your save-idea phrase so I can store it.';
    }
    return 'Could not save that as an idea. Try starting with "save this idea:" and then your note.';
  }

  private unknownShoppingReply(command: ParsedCommand): string {
    if (command.intent !== 'UNKNOWN') {
      return 'Could not interpret that as a shopping list update. Try again.';
    }
    switch (command.reason) {
      case 'empty':
        return 'That message was empty. Try listing items to buy.';
      case 'unintelligible':
        return 'I could not make sense of that. Try shorter wording or type item names.';
      case 'no_shopping_intent':
        return 'That does not look like a shopping list. Say what to buy, e.g. "bread, coffee".';
      case 'ambiguous':
        return 'That was ambiguous. Name the items clearly.';
      default:
        return 'Could not add shopping items from that. Try again or rephrase.';
    }
  }
}
