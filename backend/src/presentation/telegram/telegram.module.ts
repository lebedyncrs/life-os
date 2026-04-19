import { Module } from '@nestjs/common';
import { BirthdaysModule } from '../../infrastructure/birthdays/birthdays.module';
import { IdeasModule } from '../../infrastructure/ideas/ideas.module';
import { IdentityModule } from '../../infrastructure/identity/identity.module';
import { NluModule } from '../../infrastructure/nlu/nlu.module';
import { ShoppingModule } from '../../infrastructure/shopping/shopping.module';
import { TelegramCoreModule } from '../../infrastructure/telegram/telegram-core.module';
import { TelegramController } from './telegram.controller';
import { TelegramUpdateRouterService } from './telegram-update-router.service';
import { VoiceIngestService } from './voice-ingest.service';

@Module({
  imports: [TelegramCoreModule, IdentityModule, NluModule, ShoppingModule, IdeasModule, BirthdaysModule],
  controllers: [TelegramController],
  providers: [VoiceIngestService, TelegramUpdateRouterService],
})
export class TelegramModule {}
