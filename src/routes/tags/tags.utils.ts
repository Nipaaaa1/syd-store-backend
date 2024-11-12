import { and, eq } from "drizzle-orm"
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

export const getTagFromId = async (tagsId: string, ownerId: string) => {
  return await handlePromise(
    db
    .select()
    .from(tagsTable)
    .where(
      and(
        eq(tagsTable.owner_id, ownerId),
        eq(tagsTable.id, tagsId)
      )
    )
  )
}

export const addTagWithOwnerId = async (tagsName: string, ownerId: string) => {
  return await handlePromise(db
    .insert(tagsTable)
    .values({
      name: tagsName,
      owner_id: ownerId
    })
    .returning()
  )
}

export const updateTagsWithId = async (tagsId: string, ownerId: string, name: string) => {
  return await handlePromise(
    db
    .update(tagsTable)
    .set({ name })
    .where(
        and(
          eq(tagsTable.owner_id, ownerId),
          eq(tagsTable.id, tagsId)
        )
    )
    .returning()
  )
}

export const deleteTagsWithId = async (tagsId: string, ownerId: string) => {
  return await handlePromise(
    db
    .delete(tagsTable)
    .where(
      and(
        eq(tagsTable.owner_id, ownerId),
        eq(tagsTable.id, tagsId)
      )
    )
    .returning()
  )
}
