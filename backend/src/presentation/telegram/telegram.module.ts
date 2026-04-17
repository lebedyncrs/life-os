import { Module } from '@nestjs/common';
import { Bot } from 'grammy';
import { IdentityModule } from '../../infrastructure/identity/identity.module';
import { GrammBotFactory } from '../../infrastructure/telegram/grammy-bot.factory';
import { TelegramController } from './telegram.controller';
import { TelegramUpdateRouterService } from './telegram-update-router.service';

@Module({
  imports: [IdentityModule],
  controllers: [TelegramController],
  providers: [
    GrammBotFactory,
    {
      provide: Bot,
      useFactory: (factory: GrammBotFactory) => factory.createBot(),
      inject: [GrammBotFactory],
    },
    TelegramUpdateRouterService,
  ],
})
export class TelegramModule {}
