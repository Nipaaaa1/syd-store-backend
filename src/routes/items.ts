import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";
import { db } from "../db/index.js";
import { itemsTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

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

export default items
