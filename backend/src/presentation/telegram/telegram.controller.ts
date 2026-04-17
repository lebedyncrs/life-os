import { All, Controller, Param, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Bot } from 'grammy';
import { webhookCallback } from 'grammy';
import type { Request, Response } from 'express';
import type { Env } from '../../infrastructure/config/env.schema';

@Controller()
export class TelegramController {
  constructor(
    private readonly bot: Bot,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @All('telegram/webhook/:secret')
  handleWebhook(
    @Param('secret') secret: string,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    const expected = this.config.get('TELEGRAM_WEBHOOK_SECRET', { infer: true });
    if (secret !== expected) {
      res.status(401).end();
      return;
    }
    const handler = webhookCallback(this.bot, 'express', { timeoutMilliseconds: 55000 });
    void handler(req, res);
  }
}
