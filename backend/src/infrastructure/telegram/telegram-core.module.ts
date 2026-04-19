import { Global, Module } from '@nestjs/common';
import { Bot } from 'grammy';
import { GrammBotFactory } from './grammy-bot.factory';

/**
 * Shared grammY `Bot` for webhook handling and outbound reminder sends (US5).
 */
@Global()
@Module({
  providers: [
    GrammBotFactory,
    {
      provide: Bot,
      useFactory: (factory: GrammBotFactory) => factory.createBot(),
      inject: [GrammBotFactory],
    },
  ],
  exports: [Bot, GrammBotFactory],
})
export class TelegramCoreModule {}
