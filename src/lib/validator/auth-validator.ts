import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().max(16),
  email: z.string().email(),
  password: z.string().min(8).max(16)
})

export const loginSchema = registerSchema.omit({
  name: true
})

