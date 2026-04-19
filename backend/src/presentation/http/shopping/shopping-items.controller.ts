import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShoppingRepository } from '../../../application/shopping/shopping.repository';
import { CurrentOwnerId } from '../auth/current-owner.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { PatchShoppingItemDto } from './dto/patch-shopping-item.dto';

function toShoppingJson(item: {
  id: string;
  title: string;
  isDone: boolean;
  source: string;
  createdAt: Date;
}) {
  return {
    id: item.id,
    title: item.title,
    is_done: item.isDone,
    source: item.source,
    created_at: item.createdAt.toISOString(),
  };
}

@Controller('shopping-items')
@UseGuards(SessionAuthGuard)
export class ShoppingItemsController {
  constructor(private readonly shopping: ShoppingRepository) {}

  @Get()
  async list(@CurrentOwnerId() ownerId: string) {
    const rows = await this.shopping.listByOwner(ownerId);
    return rows.map(toShoppingJson);
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentOwnerId() ownerId: string, @Body() dto: CreateShoppingItemDto) {
    const row = await this.shopping.createDashboardItem(ownerId, dto.title);
    return toShoppingJson(row);
  }

  @Patch(':id')
  async patch(
    @CurrentOwnerId() ownerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchShoppingItemDto,
  ) {
    const row = await this.shopping.updateForOwner(ownerId, id, {
      title: dto.title,
      isDone: dto.is_done,
    });
    if (!row) {
      throw new NotFoundException();
    }
    return toShoppingJson(row);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentOwnerId() ownerId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const ok = await this.shopping.deleteForOwner(ownerId, id);
    if (!ok) {
      throw new NotFoundException();
    }
  }
}
