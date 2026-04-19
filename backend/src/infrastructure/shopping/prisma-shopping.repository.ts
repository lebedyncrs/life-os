import { Injectable } from '@nestjs/common';
import { ShoppingListItemSource, type ShoppingListItem } from '@prisma/client';
import {
  ShoppingRepository,
  type NewShoppingItem,
} from '../../application/shopping/shopping.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaShoppingRepository extends ShoppingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async deleteOpenItemsForOwner(ownerId: string): Promise<void> {
    await this.prisma.shoppingListItem.deleteMany({
      where: { ownerId, isDone: false },
    });
  }

  async createItems(ownerId: string, items: NewShoppingItem[]): Promise<string[]> {
    if (items.length === 0) {
      return [];
    }
    const maxRow = await this.prisma.shoppingListItem.aggregate({
      where: { ownerId },
      _max: { sortOrder: true },
    });
    let order = (maxRow._max.sortOrder ?? 0) + 1;
    const created: string[] = [];
    for (const item of items) {
      const title = item.title.trim().slice(0, 500);
      if (!title) {
        continue;
      }
      await this.prisma.shoppingListItem.create({
        data: {
          ownerId,
          title,
          source: item.source,
          isDone: false,
          sortOrder: order,
        },
      });
      order += 1;
      created.push(title);
    }
    return created;
  }

  async listByOwner(ownerId: string): Promise<ShoppingListItem[]> {
    return this.prisma.shoppingListItem.findMany({
      where: { ownerId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findByIdForOwner(ownerId: string, id: string): Promise<ShoppingListItem | null> {
    return this.prisma.shoppingListItem.findFirst({
      where: { id, ownerId },
    });
  }

  async updateForOwner(
    ownerId: string,
    id: string,
    data: { title?: string; isDone?: boolean },
  ): Promise<ShoppingListItem | null> {
    const existing = await this.findByIdForOwner(ownerId, id);
    if (!existing) {
      return null;
    }
    return this.prisma.shoppingListItem.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim().slice(0, 500) } : {}),
        ...(data.isDone !== undefined ? { isDone: data.isDone } : {}),
      },
    });
  }

  async deleteForOwner(ownerId: string, id: string): Promise<boolean> {
    const existing = await this.findByIdForOwner(ownerId, id);
    if (!existing) {
      return false;
    }
    await this.prisma.shoppingListItem.delete({ where: { id } });
    return true;
  }

  async createDashboardItem(ownerId: string, title: string): Promise<ShoppingListItem> {
    const trimmed = title.trim().slice(0, 500);
    const maxRow = await this.prisma.shoppingListItem.aggregate({
      where: { ownerId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxRow._max.sortOrder ?? 0) + 1;
    return this.prisma.shoppingListItem.create({
      data: {
        ownerId,
        title: trimmed,
        source: ShoppingListItemSource.dashboard,
        isDone: false,
        sortOrder,
      },
    });
  }
}
