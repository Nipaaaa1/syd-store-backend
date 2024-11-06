import { eq } from 'drizzle-orm'
import type { dbType as db } from '../index.ts'
import { itemsTable, usersTable } from '../schema.js'
import data from './data/items.json'

export const seedItems = async (db: db) => {
  await Promise.all(
    data.map(async (item) => {
      const owner = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.name, item.ownerName))
      await db
        .insert(itemsTable)
        .values({
          name: item.name,
          quantity: item.quantity,
          owner_id: owner[0].id
        })
    })
  )
} 
