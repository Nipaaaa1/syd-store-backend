import type { dbType as db } from '../index.js'
import { tagsTable } from '../schema.js'
import data from './data/tags.json'

export const seedTags = async (db: db) => {
  await Promise.all(
    data.map(async (tags) => {
      await db.insert(tagsTable).values(tags)
    })
  )
}
