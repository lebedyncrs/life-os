import type { ShoppingListItemSource } from '@prisma/client';

export type NewShoppingItem = {
  title: string;
  source: ShoppingListItemSource;
};

export abstract class ShoppingRepository {
  abstract deleteOpenItemsForOwner(ownerId: string): Promise<void>;

  /** Returns titles that were persisted (skips empty titles). */
  abstract createItems(ownerId: string, items: NewShoppingItem[]): Promise<string[]>;
}
