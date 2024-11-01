import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db/index.ts'
import { usersTable } from './db/schema.ts'
import { logger } from 'hono/logger';
import auth from './routes/auth.ts';
import { jwt, type JwtVariables } from 'hono/jwt';
import { env } from 'hono/adapter';

const app = new Hono<{ Variables: JwtVariables }>()

app.use(logger())

app.use('/items/*', (c, next) => {
  const { JWT_ACCESS_TOKEN_SECRET } = env(c)
  const jwtMiddleware = jwt({
    secret: JWT_ACCESS_TOKEN_SECRET as string
  })

  return jwtMiddleware(c, next)
})

app.get('/', async (c) => {
  const user = await db.select().from(usersTable)
  return c.json({
    data: user 
  })
})

app.get('/items/test', (c) => {
  return c.text('Berhasil')
})

app.route('/auth', auth)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
