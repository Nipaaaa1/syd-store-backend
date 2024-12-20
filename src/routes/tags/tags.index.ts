import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";
import { returnData, returnError } from "../../lib/utils.js";
import { zValidator } from "@hono/zod-validator";
import { insertTags } from "./tags.schema.js";
import { addTagWithOwnerId, deleteTagsWithId, getAllTagsFromOwnerId, getTagFromId, updateTagsWithId } from "./tags.utils.js";

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
  const { sub: subject } = c.get('jwtPayload')

  const [ error, data ] = await getAllTagsFromOwnerId(subject)

  if(error) return c.json(returnError(error.message))
  
  return c.json(returnData(data))
})

tags.get(':id', async c => {
  const { sub: subject } = c.get('jwtPayload')
  const { id } = c.req.param()

  const [ error, data ] = await getTagFromId(id, subject)

  if(error) return c.json(returnError(error.message))

  return c.json(returnData(data))

})

tags.post('/', zValidator('json', insertTags), async c => {
  const { name } = c.req.valid('json')
  const { sub: subject } = c.get('jwtPayload')

  const [ error, data ] = await addTagWithOwnerId(name, subject) 
     
  if(error) return c.json(returnError(error.message))
  
  return c.json(returnData(data))
})

tags.put('/:id', zValidator('json', insertTags), async c => {
  const { name } = c.req.valid('json')
  const { sub: subject } = c.get('jwtPayload')
  const tagId = c.req.param('id')

  const [ error, data ] = await updateTagsWithId(tagId, subject, name)

  if(error) return c.json(returnError(error.message))

  return c.json(returnData(data))
})

tags.delete('/:id', async c => {
  const { sub: subject } = c.get('jwtPayload')
  const { id } = c.req.param()

  const [ error, data ] = await deleteTagsWithId(id, subject)

  if(error) return c.json(returnError(error.message))

  return c.json(returnData(data))
})

export default tags
