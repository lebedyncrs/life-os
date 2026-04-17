import { Module } from '@nestjs/common';
import { CaptureShoppingFromTelegramUseCase } from '../../application/shopping/capture-shopping-from-telegram.use-case';
import { ShoppingRepository } from '../../application/shopping/shopping.repository';
import { NluModule } from '../nlu/nlu.module';
import { PrismaShoppingRepository } from './prisma-shopping.repository';

@Module({
  imports: [NluModule],
  providers: [
    { provide: ShoppingRepository, useClass: PrismaShoppingRepository },
    CaptureShoppingFromTelegramUseCase,
  ],
  exports: [CaptureShoppingFromTelegramUseCase, ShoppingRepository],
})
export class ShoppingModule {}
