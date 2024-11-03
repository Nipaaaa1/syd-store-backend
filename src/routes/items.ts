import { Hono } from "hono";
import { env } from "hono/adapter";
import { jwt, type JwtVariables } from "hono/jwt";

const items = new Hono<{ Variables:JwtVariables}>()

items.use('/*', (c, next) => {
  const { JWT_ACCESS_TOKEN_SECRET } = env(c)
  const jwtMiddleware = jwt({
    secret: JWT_ACCESS_TOKEN_SECRET as string
  })
  return jwtMiddleware(c, next)
})

items.get('/', (c) => {
  return c.text('Berhasil')
})

export default items
