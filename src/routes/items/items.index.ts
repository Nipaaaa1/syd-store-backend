import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { addItemWithOwnerId, deleteItemWithItemId, getAllItemsFromOwnerId, getItemFromId, updateItemWithOwnerId } from "./items.utils.js";
import { returnData, returnError } from "../../lib/utils.js";
import { insertItems } from "./items.schema.js";

const items = new Hono<{ Variables:JwtVariables}>()

items.use('/*', (c, next) => {
  const { JWT_ACCESS_TOKEN_SECRET } = env(c)
  const jwtMiddleware = jwt({
    secret: JWT_ACCESS_TOKEN_SECRET as string
  })
  return jwtMiddleware(c, next)
})

items.get('/', async (c) => {
  const { sub: subject } = c.get('jwtPayload')
  
  const [ error, data ] = await getAllItemsFromOwnerId(subject)

  if(error) return c.json(returnError(error.message))

  return c.json(returnData(data))
})

items.get('/:id', async (c) => {
  const { sub: subject } = c.get('jwtPayload')
  const itemId = c.req.param('id')

  const [ error, data ] = await getItemFromId(itemId, subject)
  
  if(error) return c.json(returnError(error.message))

  return c.json(returnData(data[0]))
})

items.post('/', zValidator('json', insertItems), async (c) => {
  const requestData = c.req.valid('json')
  const { sub: subject } = c.get('jwtPayload')

  const [ error, data ] = await addItemWithOwnerId(requestData, subject)

  if(error) return c.json(returnError(error.message))
  
  return c.json(returnData(data[0]))
})

items.put('/:id', zValidator('json', insertItems.partial()), async (c) => {
  const requestData = c.req.valid('json')
  const itemId = c.req.param('id')
  const { sub: subject } = c.get('jwtPayload')

  const [ error, data ] = await updateItemWithOwnerId(requestData, itemId, subject)

  if(error) return c.json(returnError(error.message))
  
  return c.json(returnData(data[0]))
})

items.delete('/:id', async (c) => {
  const itemId = c.req.param('id')
  const { sub: subject } = c.get('jwtPayload')

  const [ error, data ] = await deleteItemWithItemId(itemId, subject)
  
  if(error) return c.json(returnError(error.message))

  return c.json(returnData(data[0]))
   
})

export default items
