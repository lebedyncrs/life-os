import { Injectable } from '@nestjs/common';
import { AuditChannel, IdeaSource } from '@prisma/client';
import { isSaveIdea, type ParsedCommand } from '../nlu/nlu.types';
import { AuditLogger } from '../ports/audit-logger.port';
import { IdeaRepository } from './idea.repository';

export type IdeaSaveOutcome =
  | { kind: 'saved'; id: string; bodyChars: number }
  | { kind: 'unknown'; command: ParsedCommand };

@Injectable()
export class SaveIdeaFromTelegramUseCase {
  constructor(
    private readonly ideas: IdeaRepository,
    private readonly audit: AuditLogger,
  ) {}

  /** Persist when NLU already produced {@link ParsedCommand} (single parse per Telegram message). */
  async executeFromParsed(ownerId: string, cmd: ParsedCommand): Promise<IdeaSaveOutcome> {
    if (!isSaveIdea(cmd)) {
      return { kind: 'unknown', command: cmd };
    }

    const body = cmd.payload.body.trim();
    if (!body) {
      return { kind: 'unknown', command: { intent: 'UNKNOWN', reason: 'empty' } };
    }

    const titleRaw = cmd.payload.title?.trim();
    const title = titleRaw && titleRaw.length > 0 ? titleRaw : null;

    const row = await this.ideas.create(ownerId, {
      body,
      title,
      source: IdeaSource.telegram,
    });
    const { id } = row;

    await this.audit.log({
      ownerId,
      action: 'idea.create',
      entityType: 'Idea',
      entityId: id,
      channel: AuditChannel.telegram,
      metadata: {
        bodyChars: body.length,
        hasTitle: Boolean(title),
      },
    });

    return { kind: 'saved', id, bodyChars: body.length };
  }
}
