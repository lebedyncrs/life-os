import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { ParsedCommand } from '../../application/nlu/nlu.types';
import { NluPort, type TelegramTextNluInput, type TelegramVoiceNluInput } from '../../application/ports/nlu.port';
import type { Env } from '../config/env.schema';

const llmJsonSchema = z.object({
  intent: z.enum(['ADD_SHOPPING', 'SAVE_IDEA', 'UNKNOWN']),
  items: z.array(z.string()).optional(),
  replace_all: z.boolean().optional(),
  body: z.string().optional(),
  title: z.string().nullable().optional(),
  reason: z.enum(['empty', 'unintelligible', 'no_shopping_intent', 'ambiguous', 'other']).optional(),
});

@Injectable()
export class OpenAiNluAdapter extends NluPort {
  private readonly logger = new Logger(OpenAiNluAdapter.name);

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async parseTelegramText(input: TelegramTextNluInput): Promise<ParsedCommand> {
    return this.classifyText(input.text);
  }

  async parseTelegramVoiceTranscript(input: TelegramVoiceNluInput): Promise<ParsedCommand> {
    return this.classifyText(input.transcript);
  }

  private async classifyText(raw: string): Promise<ParsedCommand> {
    const text = raw.trim();
    if (!text) {
      return { intent: 'UNKNOWN', reason: 'empty' };
    }

    const apiKey = this.config.get('NLU_PROVIDER_API_KEY', { infer: true });
    const baseUrl = (this.config.get('NLU_PROVIDER_BASE_URL', { infer: true }) ?? 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    );
    if (!apiKey) {
      this.logger.warn('NLU_PROVIDER_API_KEY missing — returning UNKNOWN');
      return { intent: 'UNKNOWN', reason: 'other' };
    }

    const model = this.config.get('NLU_CHAT_MODEL', { infer: true });

    const system = `You classify messages for a personal assistant (shopping list + idea capture).
Return ONLY valid JSON (no markdown) with this shape:
{"intent":"ADD_SHOPPING"|"SAVE_IDEA"|"UNKNOWN","items":string[]?,"replace_all":boolean?,"body":string?,"title":string|null?,"reason":optional only if intent is UNKNOWN: one of empty|unintelligible|no_shopping_intent|ambiguous|other}

Rules:
- **SAVE_IDEA** when the user clearly wants to save a thought or note, especially phrases like "save this idea", "remember this idea", "note to self", "idea:", "save idea:" followed by content. Put the full idea text in "body" (you may strip the leading cue phrase). Optional short "title" if they gave a headline; otherwise null.
- **Ambiguity**: If both shopping and idea could apply but the user used an explicit save-idea phrase, choose **SAVE_IDEA**.
- **ADD_SHOPPING** when they are clearly listing things to buy; "items" = distinct product names, trimmed, no duplicates. "replace_all" true only if they clearly want to replace the entire shopping list.
- **UNKNOWN** for greetings, unrelated chat, or unclear intent; include "reason".`;

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: text },
          ],
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        this.logger.warn(`NLU HTTP ${res.status}: ${errBody.slice(0, 200)}`);
        return { intent: 'UNKNOWN', reason: 'other' };
      }

      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      if (!content) {
        return { intent: 'UNKNOWN', reason: 'other' };
      }

      const parsed = JSON.parse(content) as unknown;
      const data = llmJsonSchema.safeParse(parsed);
      if (!data.success) {
        this.logger.warn(`NLU JSON schema mismatch: ${data.error.message}`);
        return { intent: 'UNKNOWN', reason: 'ambiguous' };
      }

      const v = data.data;
      if (v.intent === 'UNKNOWN') {
        return { intent: 'UNKNOWN', reason: v.reason ?? 'other' };
      }

      if (v.intent === 'SAVE_IDEA') {
        const ideaBody = (v.body ?? '').trim();
        if (!ideaBody) {
          return { intent: 'UNKNOWN', reason: 'ambiguous' };
        }
        const title = v.title === undefined || v.title === null ? null : String(v.title).trim() || null;
        return {
          intent: 'SAVE_IDEA',
          payload: {
            body: ideaBody,
            title,
          },
        };
      }

      const items = (v.items ?? [])
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 50);

      if (items.length === 0) {
        return { intent: 'UNKNOWN', reason: 'no_shopping_intent' };
      }

      return {
        intent: 'ADD_SHOPPING',
        payload: {
          items,
          replaceAll: Boolean(v.replace_all),
        },
      };
    } catch (e) {
      this.logger.warn(`NLU request failed: ${e instanceof Error ? e.message : String(e)}`);
      return { intent: 'UNKNOWN', reason: 'other' };
    }
  }
}
