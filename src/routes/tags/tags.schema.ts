import { createInsertSchema } from "drizzle-zod";
import { tagsTable } from "../../db/schema.js";


export const insertTags = createInsertSchema(tagsTable, {
  owner_id: schema => schema.owner_id.optional()
})
