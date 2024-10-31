import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db/index.ts'
import { usersTable } from './db/schema.ts'
import { registerSchema } from "./lib/validator/auth-validator.ts";
import { logger } from 'hono/logger';
import { sign } from 'hono/jwt';
import { env } from 'hono/adapter';

const app = new Hono()

app.use(logger())

app.get('/', async (c) => {
  const user = await db.select({
    user_name: usersTable.name
  }).from(usersTable)
  return c.json({
    data: user 
  })
})

app.post('/auth/register', async (c) => {
  const userData = await c.req.json()

  const validUserData = registerSchema.safeParse(userData)

  if(validUserData.error) {
    return c.json(validUserData.error.format())
  }

  const accessTokenPayload = {
    sub: validUserData.data.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 15
  }

  const refreshTokenPayload = {
    sub: validUserData.data.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  }

  const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } = env(c)

  const accessToken = await sign(accessTokenPayload, JWT_ACCESS_TOKEN_SECRET as string)
  const refreshToken = await sign(refreshTokenPayload, JWT_REFRESH_TOKEN_SECRET as string)

  return c.json({
    success: true,
    data: {
      access_token: accessToken,
      refresh_token: refreshToken
    }
  })


})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
