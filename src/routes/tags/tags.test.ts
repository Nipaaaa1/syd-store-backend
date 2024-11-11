import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/index.js";
import { tagsTable, usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { dateInSeconds } from "../../lib/utils.js";
import { sign } from "hono/jwt";
import tags from "./tags.index.js";

describe('tags routes tests', () => {
  let accessToken = ''
  let dummyTags = {
    name: 'Camping Gear'
  }

  beforeAll(async () => {
    const [ data ] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email
      })
      .from(usersTable)
      .where(eq(usersTable.name, 'Bob Smith'))
    const payload = {
      sub: data.id,
      email: data.email,
      exp: dateInSeconds(60 * 15)
    }
    accessToken = await sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET as string)
  })

  afterAll(async () => {
    await db.delete(tagsTable).where(eq(tagsTable.name, dummyTags.name))
  })

  it('should return all tags from the owner', async () => {
    const res = await tags.request('/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })

  it('should create a new tags', async () => {
    const res = await tags.request('/', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(dummyTags)
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })
})
