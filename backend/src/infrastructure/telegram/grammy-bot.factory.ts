import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import type { Env } from '../config/env.schema';

@Injectable()
export class GrammBotFactory {
  constructor(private readonly config: ConfigService<Env, true>) {}

  createBot(): Bot {
    const token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    return new Bot(token);
  }
}
