import { Hono } from "hono";
import { registerSchema } from "../lib/validator/auth-validator.js";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hash } from '@node-rs/argon2'
import { dateInSeconds } from "../lib/utils.js";
import { sign } from "hono/jwt";
import { env } from "hono/adapter";

const auth = new Hono()

auth.post('/register', async (c) => {
  const data = await c.req.json()

  const validatedData = registerSchema.safeParse(data)
  if(!validatedData.success) {
    return c.json(validatedData.error.format())
  }

  const checkDb = await db.select({
    email: usersTable.email
  }).from(usersTable).where(eq(usersTable.email, validatedData.data.email))
  if(checkDb) {
    return c.json({
      error: "Email already exists!"
    })
  }

  const hashedPassword = await hash(validatedData.data.password, {
    parallelism: 1
  })

  const userData = await db.insert(usersTable).values({
    name: validatedData.data.name,
    email: validatedData.data.email,
    password_hash: hashedPassword
  }).returning({
    userId: usersTable.id,
    userEmail: usersTable.email
  })

  const accessPayload = {
    sub: userData[0].userId,
    email: userData[0].userEmail,
    exp: dateInSeconds(60 * 15) 
  }

  const refreshPayload = {
    sub: userData[0].userId,
    exp: dateInSeconds(60 * 60 * 24 * 30)
  }

  return c.json({
    success: true,
    data: userData
  })
})

export default auth
