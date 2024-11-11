import { and, eq } from "drizzle-orm"
import { db } from "../../db/index.js"
import { itemsTable } from "../../db/schema.js"
import { handlePromise } from "../../lib/utils.js"
import type { insertItems } from "./items.schema.js"

export const getAllItemsFromOwnerId = async (ownerId: string) => {
  return await handlePromise(db
    .select()
    .from(itemsTable)
    .where(
      eq(itemsTable.owner_id, ownerId)
    )
  )
}

export const getItemFromId = async (itemId: string, ownerId: string) => {
  return await handlePromise(db
    .select()
    .from(itemsTable)
    .where(
      and(
        eq(itemsTable.owner_id, ownerId),
        eq(itemsTable.id, itemId)
      )
    )
  )
}

export const addItemWithOwnerId = async (item: insertItems, ownerId: string) => {
  return await handlePromise(db
    .insert(itemsTable)
    .values({
      name: item.name,
      quantity: item.quantity,
      owner_id: ownerId
    })
    .returning()
  )
}

export const updateItemWithOwnerId = async (item: Partial<insertItems>, itemId: string, ownerId: string) => {
  return await handlePromise(db
    .update(itemsTable)
    .set(item)
    .where(
      and(
        eq(itemsTable.owner_id, ownerId),
        eq(itemsTable.id, itemId)
      )
    )
    .returning()
  )
}

export const deleteItemWithItemId = async (itemId: string, ownerId: string) => {
  return await handlePromise(db
    .delete(itemsTable)
    .where(
      and(
        eq(itemsTable.owner_id, ownerId),
        eq(itemsTable.id, itemId)
      )
    )
    .returning()
  )
}
