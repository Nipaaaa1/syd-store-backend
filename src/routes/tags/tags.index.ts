import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";
import { handlePromise, returnData, returnError } from "../../lib/utils.js";
import { db } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { tagsTable } from "../../db/schema.js";

const tags = new Hono<{
  Variables: JwtVariables
}>()

tags.use('/*', (c, next) => {
  const { JWT_ACCESS_TOKEN_SECRET } = env(c)
  
  const jwtMiddleware = jwt({
    secret: JWT_ACCESS_TOKEN_SECRET as string
  })

  return jwtMiddleware(c, next)
})

tags.get('/', async c => {
  const payload = c.get('jwtPayload')

  const [ error, data ] = await handlePromise(db
    .select()
    .from(tagsTable)
    .where(
      eq(tagsTable.owner_id, payload.sub)
    )
  )

  if(error) return c.json(returnError(error.message))
  
  return c.json(returnData(data))
})

export default tags
