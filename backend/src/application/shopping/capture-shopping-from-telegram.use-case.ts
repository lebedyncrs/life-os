import { Injectable } from '@nestjs/common';
import { AuditChannel, ShoppingListItemSource } from '@prisma/client';
import { isAddShopping, type ParsedCommand } from '../nlu/nlu.types';
import { AuditLogger } from '../ports/audit-logger.port';
import { NluPort } from '../ports/nlu.port';
import { ShoppingRepository } from './shopping.repository';

export type ShoppingCaptureOutcome =
  | { kind: 'added'; count: number; titles: string[] }
  | { kind: 'unknown'; command: ParsedCommand };

@Injectable()
export class CaptureShoppingFromTelegramUseCase {
  constructor(
    private readonly nlu: NluPort,
    private readonly shopping: ShoppingRepository,
    private readonly audit: AuditLogger,
  ) {}

  async executeFromText(ownerId: string, text: string): Promise<ShoppingCaptureOutcome> {
    const cmd = await this.nlu.parseTelegramText({ text });
    return this.persistIfShopping(ownerId, cmd, ShoppingListItemSource.telegram_text);
  }

  async executeFromTranscript(ownerId: string, transcript: string): Promise<ShoppingCaptureOutcome> {
    const cmd = await this.nlu.parseTelegramVoiceTranscript({ transcript });
    return this.persistIfShopping(ownerId, cmd, ShoppingListItemSource.telegram_voice);
  }

  /** Use when {@link ParsedCommand} was already computed for this message (e.g. shared with idea routing). */
  async executeFromParsed(
    ownerId: string,
    cmd: ParsedCommand,
    source: ShoppingListItemSource,
  ): Promise<ShoppingCaptureOutcome> {
    return this.persistIfShopping(ownerId, cmd, source);
  }

  private async persistIfShopping(
    ownerId: string,
    cmd: ParsedCommand,
    source: ShoppingListItemSource,
  ): Promise<ShoppingCaptureOutcome> {
    if (!isAddShopping(cmd)) {
      return { kind: 'unknown', command: cmd };
    }

    const { items, replaceAll } = cmd.payload;
    if (replaceAll) {
      await this.shopping.deleteOpenItemsForOwner(ownerId);
    }

    const rows = items.map((title) => ({ title, source }));
    const titles = await this.shopping.createItems(ownerId, rows);

    await this.audit.log({
      ownerId,
      action: 'shopping.create',
      channel: AuditChannel.telegram,
      metadata: {
        count: titles.length,
        replaceAll,
        source,
      },
    });

    return { kind: 'added', count: titles.length, titles };
  }
}
