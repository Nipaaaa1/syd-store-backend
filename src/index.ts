import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db/index.ts'
import { usersTable } from './db/schema.ts'
import { logger } from 'hono/logger';
import auth from './routes/auth.ts';

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

app.route('/auth', auth)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
