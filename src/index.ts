import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db/index.ts'

const app = new Hono()

app.get('/', async (c) => {
  const user = await db.query.usersTable.findMany({
    columns: {
      name: true,
    },
    with: {
      items: {
        columns: {
          name: true,
          quantity: true
        }
      }
    }
  })
  return c.json({
    data: user 
  })
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
