import { eq } from "drizzle-orm"
import { db } from "../../db/index.js"
import { tagsTable } from "../../db/schema.js"
import { handlePromise } from "../../lib/utils.js"

export const getAllTagsFromOwnerId = async (ownerId: string) => {
  return await handlePromise(db
    .select()
    .from(tagsTable)
    .where(
      eq(tagsTable.owner_id, ownerId)
    )
  )
}