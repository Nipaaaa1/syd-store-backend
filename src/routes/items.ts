import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";
import { db } from "../db/index.js";
import { itemsTable } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { addItemSchema } from "../lib/validator/items-validator.js";

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

items.post('/', async (c) => {
  const requestData = await c.req.json()
  const payload = c.get('jwtPayload')

  const validatedData = addItemSchema.safeParse(requestData)

  if(!validatedData.success) {
    return c.json({
      success: false,
      error: validatedData.error.format()
    })
  }

  const item = await db.insert(itemsTable).values({
    name: validatedData.data.name,
    quantity: validatedData.data.quantity,
    owner_id: payload.sub
  }).returning()

  return c.json({
    success: true,
    data: item[0]
  })
})

items.put('/:id', async (c) => {
  const requestData = await c.req.json()
  const itemId = c.req.param('id')
  const payload = c.get('jwtPayload')

  const validatedData = addItemSchema.partial().safeParse(requestData)

  if(validatedData.data === undefined) {
    return c.json({
      success: false,
      error: {
        message: 'Nothing to update.'
      }
    })
  }

  const updatedItem = await db.update(itemsTable).set({
    name: validatedData.data.name,
    quantity: validatedData.data.quantity
  }).where(and(eq(itemsTable.id, itemId), eq(itemsTable.owner_id, payload.sub))).returning({
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

export default items
