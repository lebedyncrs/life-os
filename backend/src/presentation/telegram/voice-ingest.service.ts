import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import type { Context } from 'grammy';
import type { Env } from '../../infrastructure/config/env.schema';

const MAX_AUDIO_DURATION_SEC = 600;

@Injectable()
export class VoiceIngestService {
  private readonly logger = new Logger(VoiceIngestService.name);

  constructor(
    @Inject(Bot) private readonly bot: Bot,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Downloads Telegram `voice` or short `audio` and transcribes via OpenAI-compatible Whisper endpoint.
   * Returns null when transcription is unavailable (caller should prompt user to retry).
   */
  async transcribeVoiceMessage(ctx: Context): Promise<string | null> {
    const msg = ctx.message;
    if (!msg) {
      return null;
    }

    let fileId: string | undefined;
    let uploadName = 'voice.ogg';

    if ('voice' in msg && msg.voice) {
      fileId = msg.voice.file_id;
      const mt = msg.voice.mime_type ?? '';
      uploadName = mt.includes('ogg') ? 'voice.ogg' : 'voice.oga';
    } else if ('audio' in msg && msg.audio) {
      const a = msg.audio;
      if (!a.duration || a.duration > MAX_AUDIO_DURATION_SEC) {
        this.logger.debug('Skipping audio: missing duration or too long for voice-style ingest');
        return null;
      }
      fileId = a.file_id;
      const ext = (a.mime_type?.split('/')[1] ?? 'mpeg').replace(/[^a-z0-9]/gi, '') || 'mpeg';
      uploadName = `audio.${ext}`;
    } else {
      return null;
    }

    if (!fileId) {
      return null;
    }

    const apiKey = this.config.get('NLU_PROVIDER_API_KEY', { infer: true });
    const baseUrl = (this.config.get('NLU_PROVIDER_BASE_URL', { infer: true }) ?? 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    );
    if (!apiKey) {
      this.logger.warn('NLU_PROVIDER_API_KEY missing — cannot transcribe voice');
      return null;
    }

    try {
      const file = await ctx.api.getFile(fileId);
      const path = file.file_path;
      if (!path) {
        return null;
      }
      const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${path}`;
      const audioRes = await fetch(fileUrl);
      if (!audioRes.ok) {
        this.logger.warn(`Failed to download voice file: ${audioRes.status}`);
        return null;
      }
      const buf = Buffer.from(await audioRes.arrayBuffer());
      const form = new FormData();
      form.append('file', new Blob([buf]), uploadName);
      form.append('model', 'whisper-1');

      const tr = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      if (!tr.ok) {
        const err = await tr.text().catch(() => '');
        this.logger.warn(`Whisper HTTP ${tr.status}: ${err.slice(0, 200)}`);
        return null;
      }

      const json = (await tr.json()) as { text?: string };
      const text = json.text?.trim();
      return text && text.length > 0 ? text : null;
    } catch (e) {
      this.logger.warn(`Voice transcribe failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }
}
