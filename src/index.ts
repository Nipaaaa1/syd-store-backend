import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger';
import tags from '@/routes/tags/tags.index.js';
import auth from '@/routes/auth/auth.index.js';
import items from '@/routes/items/items.index.js';

const app = new Hono()

app.use(logger())

app.get('/', async (c) => {
  return c.text('Main route')
})

app.route('/auth', auth)

app.route('/items', items)

app.route('/tags', tags)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
