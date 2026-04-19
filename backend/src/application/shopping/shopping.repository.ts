import type { ShoppingListItem, ShoppingListItemSource } from '@prisma/client';

export type NewShoppingItem = {
  title: string;
  source: ShoppingListItemSource;
};

export abstract class ShoppingRepository {
  abstract deleteOpenItemsForOwner(ownerId: string): Promise<void>;

  /** Returns titles that were persisted (skips empty titles). */
  abstract createItems(ownerId: string, items: NewShoppingItem[]): Promise<string[]>;

  abstract listByOwner(ownerId: string): Promise<ShoppingListItem[]>;

  abstract findByIdForOwner(ownerId: string, id: string): Promise<ShoppingListItem | null>;

  abstract updateForOwner(
    ownerId: string,
    id: string,
    data: { title?: string; isDone?: boolean },
  ): Promise<ShoppingListItem | null>;

  abstract deleteForOwner(ownerId: string, id: string): Promise<boolean>;

  abstract createDashboardItem(ownerId: string, title: string): Promise<ShoppingListItem>;
}
