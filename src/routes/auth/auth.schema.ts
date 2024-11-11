import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "../../db/schema.js";
import { z } from "zod";

export const insertUser = createInsertSchema(usersTable, {
  email: schema => schema.email.email()
})

export type insertUser = z.infer<typeof insertUser>
