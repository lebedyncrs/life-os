import { Injectable } from '@nestjs/common';
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
}
