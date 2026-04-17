import type { ParsedCommand } from '../nlu/nlu.types';

/** Telegram text message body (trimming is adapter responsibility). */
export type TelegramTextNluInput = {
  text: string;
};

/**
 * Voice already converted to text before the application layer (see VoiceIngestService).
 * Raw audio stays in infrastructure; this port only classifies intent from transcript.
 */
export type TelegramVoiceNluInput = {
  transcript: string;
};

export abstract class NluPort {
  abstract parseTelegramText(input: TelegramTextNluInput): Promise<ParsedCommand>;

  abstract parseTelegramVoiceTranscript(input: TelegramVoiceNluInput): Promise<ParsedCommand>;
}
