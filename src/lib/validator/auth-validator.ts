import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { usersTable } from "../../db/schema.js"

export const registerSchema = z.object({
  name: z.string().max(16),
  email: z.string().email(),
  password: z.string().min(8).max(16)
})

export const insertUser = createInsertSchema(usersTable, {
  email: (schema) => schema.email.email()
})

export type insertUserType = z.infer<typeof insertUser>

export const loginSchema = registerSchema.omit({
  name: true
})

