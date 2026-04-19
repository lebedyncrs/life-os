import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { ParsedCommand } from '../../application/nlu/nlu.types';
import { NluPort, type TelegramTextNluInput, type TelegramVoiceNluInput } from '../../application/ports/nlu.port';
import type { Env } from '../config/env.schema';

const llmJsonSchema = z.object({
  intent: z.enum(['ADD_SHOPPING', 'SAVE_IDEA', 'SET_BIRTHDAY_REMINDER', 'UNKNOWN']),
  items: z.array(z.string()).optional(),
  replace_all: z.boolean().optional(),
  body: z.string().optional(),
  title: z.string().nullable().optional(),
  person_name: z.string().optional(),
  next_occurrence_on: z.string().optional(),
  original_year_known: z.boolean().optional(),
  lead_days: z.number().int().optional(),
  notes: z.string().nullable().optional(),
  reason: z.enum(['empty', 'unintelligible', 'no_shopping_intent', 'ambiguous', 'other']).optional(),
});

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class OpenAiNluAdapter extends NluPort {
  private readonly logger = new Logger(OpenAiNluAdapter.name);

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async parseTelegramText(input: TelegramTextNluInput): Promise<ParsedCommand> {
    return this.classifyText(input.text, input.ownerTimezone);
  }

  async parseTelegramVoiceTranscript(input: TelegramVoiceNluInput): Promise<ParsedCommand> {
    return this.classifyText(input.transcript, input.ownerTimezone);
  }

  private async classifyText(raw: string, ownerTimezone?: string): Promise<ParsedCommand> {
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
    const tz = ownerTimezone?.trim() || 'UTC';

    const system = `You classify messages for a personal assistant (shopping list, ideas, birthday reminders).
Return ONLY valid JSON (no markdown) with this shape:
{"intent":"ADD_SHOPPING"|"SAVE_IDEA"|"SET_BIRTHDAY_REMINDER"|"UNKNOWN", ...fields per intent...,"reason":optional only if UNKNOWN}

Field rules:
- ADD_SHOPPING: "items" string[] (distinct product names), "replace_all" boolean (true only if replacing entire list).
- SAVE_IDEA: "body" string (idea text, strip leading cues), optional "title" string|null.
- SET_BIRTHDAY_REMINDER: "person_name" non-empty string, "next_occurrence_on" as YYYY-MM-DD for the NEXT celebration date in timezone ${tz}, "original_year_known" boolean, "lead_days" integer default 1 (days before to remind), optional "notes" string|null.
- UNKNOWN: optional "reason" one of empty|unintelligible|no_shopping_intent|ambiguous|other

Priority when multiple could fit:
1) Explicit save-idea phrasing → SAVE_IDEA
2) Explicit birthday / reminder phrasing (e.g. "remind me", "birthday is", "born on") → SET_BIRTHDAY_REMINDER
3) Clear shopping list → ADD_SHOPPING
4) Otherwise UNKNOWN`;

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

      if (v.intent === 'SET_BIRTHDAY_REMINDER') {
        const personName = (v.person_name ?? '').trim();
        const nextOn = (v.next_occurrence_on ?? '').trim();
        if (!personName || !isoDate.test(nextOn)) {
          return { intent: 'UNKNOWN', reason: 'ambiguous' };
        }
        const leadDays = typeof v.lead_days === 'number' && v.lead_days >= 0 ? Math.min(30, v.lead_days) : 1;
        const notes = v.notes === undefined || v.notes === null ? null : String(v.notes).trim() || null;
        return {
          intent: 'SET_BIRTHDAY_REMINDER',
          payload: {
            personName,
            nextOccurrenceOn: nextOn,
            originalYearKnown: v.original_year_known !== false,
            leadDays,
            notes,
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
