import 'dotenv/config'
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import userData from '../src/db/seed/data/users.json'
import { refreshTokenTable, usersTable } from "../src/db/schema.js"
import { db } from "../src/db/index.js"
import { eq } from "drizzle-orm"
import auth from "../src/routes/auth.js"
import { sign } from "hono/jwt"
import { dateInSeconds } from "../src/lib/utils.js"



describe('Auth routes tests', () => {
  const [ user ] = userData.filter(user => user.name === 'Bob Smith')
  const newUser = {
    name: 'Jamal',
    email: 'jamalskuy12@gmail.com',
    password: 'ulti777jamal'
  }

  let refreshToken = ''

  beforeAll(async () => {
    const [ data ] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, user.email))

    const payload = {
      sub: data.id,
      email: data.email,
      exp: dateInSeconds(60 * 60 * 24 * 30)
    }

    refreshToken = await sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET as string)
    await db
      .insert(refreshTokenTable)
      .values({
        token: refreshToken,
        owner_id: data.id
      })
  })

  afterAll(async () => {
    await db.delete(refreshTokenTable)
    await db.delete(usersTable).where(eq(usersTable.name, newUser.name))
    refreshToken = ''
  })

  it('should register a new user', async () => {
    const res = await auth.request('/register', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(newUser)
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })

  it('should login a user', async () => {
    const res = await auth.request('/login', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })

  it('should generate an access token', async () => {
    const res = await auth.request('/refresh', {
      method: 'POST',
      headers: {
        'Cookie': `refresh_token=${refreshToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })

  it('should logout a user', async () => {
    const res = await auth.request('/logout', {
      method: 'DELETE',
      headers: {
        'Cookie': `refresh_token=${refreshToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })
})
