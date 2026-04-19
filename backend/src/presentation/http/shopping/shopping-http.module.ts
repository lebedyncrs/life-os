import { Module } from '@nestjs/common';
import { ShoppingModule } from '../../../infrastructure/shopping/shopping.module';
import { AuthModule } from '../auth/auth.module';
import { ShoppingItemsController } from './shopping-items.controller';

@Module({
  imports: [AuthModule, ShoppingModule],
  controllers: [ShoppingItemsController],
})
export class ShoppingHttpModule {}
