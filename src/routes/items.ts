import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";
import { db } from "../db/index.js";
import { itemsTable } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { insertItems } from "../lib/validator/items-validator.js";
import { zValidator } from "@hono/zod-validator";

const items = new Hono<{ Variables:JwtVariables}>()

items.use('/*', (c, next) => {
  const { JWT_ACCESS_TOKEN_SECRET } = env(c)
  const jwtMiddleware = jwt({
    secret: JWT_ACCESS_TOKEN_SECRET as string
  })
  return jwtMiddleware(c, next)
})

items.get('/', async (c) => {
  const payload = c.get('jwtPayload')
  
  try {
    const allItems = await db.select().from(itemsTable).where(eq(itemsTable.owner_id, payload.sub))
    
    return c.json({
      success: true,
      data: allItems
    })
  } catch (error) {
    return c.json({
      success: false,
      error,
    })
  }
})

items.get('/:id', async (c) => {
  const payload = c.get('jwtPayload')
  const itemId = c.req.param('id')

  const item = await db.select({
    name: itemsTable.name,
    quantity: itemsTable.quantity
  }).from(itemsTable).where(and(eq(itemsTable.id, itemId), eq(itemsTable.owner_id, payload.sub)))

  if(item.length === 0) {
    return c.json({
      success: false,
      error: {
        message: "Item not found"
      }
    })
  }

  return c.json({
    success: true,
    data: item[0]
  })
})

items.post('/', zValidator('json', insertItems), async (c) => {
  const data = c.req.valid('json')
  const payload = c.get('jwtPayload')

  const item = await db.insert(itemsTable).values({
    name: data.name,
    quantity: data.quantity,
    owner_id: payload.sub
  }).returning()

  return c.json({
    success: true,
    data: item[0]
  })
})

items.put('/:id', zValidator('json', insertItems.partial()), async (c) => {
  const data = c.req.valid('json')
  const itemId = c.req.param('id')
  const payload = c.get('jwtPayload')

  const updatedItem = await db
    .update(itemsTable)
    .set(data)
    .where(
      and(
        eq(itemsTable.id, itemId),
        eq(itemsTable.owner_id, payload.sub)
      )
    )
    .returning({
      id: itemsTable.id,
      name: itemsTable.name,
      quantity: itemsTable.quantity
    })

  if(updatedItem.length === 0) {
    return c.json({
      success: false,
      error: {
        message: "Items not found"
      }
    })
  }

  return c.json({
    success: true,
    data: updatedItem[0]
  })

})

items.delete('/:id', async (c) => {
  const itemId = c.req.param('id')
  const payload = c.get('jwtPayload')

  const deletedItem = await db.delete(itemsTable).where(and(eq(itemsTable.id, itemId), eq(itemsTable.owner_id, payload.sub))).returning()

  if(deletedItem.length === 0) {
    return c.json({
      success: false,
      error: {
        message: 'Item not found'
      }
    })
  }

  return c.json({
    success: true,
    data: deletedItem[0]
  })
})

export default items
