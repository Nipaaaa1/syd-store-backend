import { z } from "zod";
import { createInsertSchema } from 'drizzle-zod'
import { itemsTable } from "../../db/schema.js";

export const insertItems = createInsertSchema(itemsTable)

export type insertItemsType = z.infer<typeof insert>

