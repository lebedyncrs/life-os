import { Module } from '@nestjs/common';
import { Bot } from 'grammy';
import { IdeasModule } from '../../infrastructure/ideas/ideas.module';
import { IdentityModule } from '../../infrastructure/identity/identity.module';
import { NluModule } from '../../infrastructure/nlu/nlu.module';
import { ShoppingModule } from '../../infrastructure/shopping/shopping.module';
import { GrammBotFactory } from '../../infrastructure/telegram/grammy-bot.factory';
import { TelegramController } from './telegram.controller';
import { TelegramUpdateRouterService } from './telegram-update-router.service';
import { VoiceIngestService } from './voice-ingest.service';

@Module({
  imports: [IdentityModule, NluModule, ShoppingModule, IdeasModule],
  controllers: [TelegramController],
  providers: [
    GrammBotFactory,
    {
      provide: Bot,
      useFactory: (factory: GrammBotFactory) => factory.createBot(),
      inject: [GrammBotFactory],
    },
    VoiceIngestService,
    TelegramUpdateRouterService,
  ],
})
export class TelegramModule {}
