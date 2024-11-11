import { createInsertSchema } from "drizzle-zod";
import { itemsTable } from "../../db/schema.js";
import { z } from "zod";

export const insertItems = createInsertSchema(itemsTable, {
  owner_id: schema => schema.owner_id.optional()
})

export type insertItems = z.infer<typeof insertItems>
