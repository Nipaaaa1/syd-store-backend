import { db } from "./db/index.js"
import { itemsTable, itemsTagsTable, refreshTokenTable, tagsTable, usersTable } from "./db/schema.js"

(async function() {
  await db.delete(refreshTokenTable)
  await db.delete(itemsTagsTable)
  await db.delete(tagsTable)
  await db.delete(itemsTable)
  await db.delete(usersTable)

  process.exit(1)
})()
