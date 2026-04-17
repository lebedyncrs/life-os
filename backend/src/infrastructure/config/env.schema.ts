import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8),
  /** Optional: auto-link this Telegram user id to the first Owner on boot (dev only). */
  TELEGRAM_CHAT_ID: z.string().regex(/^\d+$/).optional(),
  WEB_ORIGIN: z.string().url(),
  /** OpenAI-compatible API root, e.g. https://api.openai.com/v1 */
  NLU_PROVIDER_BASE_URL: z.string().url().optional(),
  NLU_PROVIDER_API_KEY: z.string().optional(),
  /** Chat model for intent + item extraction (OpenAI-compatible chat completions). */
  NLU_CHAT_MODEL: z.string().default('gpt-4o-mini'),
});

export type Env = z.infer<typeof envSchema>;
