import { eq } from 'drizzle-orm'
import type { dbType as db } from '../index.js'
import { tagsTable, usersTable } from '../schema.js'
import data from './data/tags.json'

export const seedTags = async (db: db) => {
  await Promise.all(
    data.map(async (tags) => {
      const [ userData ] = await db
        .select({
          id: usersTable.id
        })
        .from(usersTable)
        .where(eq(usersTable.name, tags.ownerName))
      await db.insert(tagsTable).values({
        name: tags.name,
        owner_id: userData.id
      })
    })
  )
}
