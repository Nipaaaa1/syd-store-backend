import { db, type dbType } from "../index.js"
import { refreshTokenTable, tagsTable, usersTable } from "../schema.js"
import { seedItems } from "./items.js"
import { seedTags } from "./tags.js"
import { seedUser } from "./users.js"


const resetTable = async (db: dbType) => {
  await db.delete(usersTable)
  await db.delete(tagsTable)
  await db.delete(refreshTokenTable)
}

const seedDb = async () => {
  await resetTable(db)
  await seedUser(db)
  await seedTags(db)
  await seedItems(db)
}

seedDb()
