import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { dateInSeconds } from "../../lib/utils.js";
import { sign } from "hono/jwt";
import tags from "./tags.index.js";

describe('tags routes tests', () => {
  let accessToken = ''
  let dummyTags = {
    name: 'Camping Gear',
    newName: 'Camping Tools'
  }
  let tagId = ''

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
    tagId = ''
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
      body: JSON.stringify({
        name: dummyTags.name
      })
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()

    tagId = data.data[0].id
  })

  it('should get a tag', async () => {
    const res = await tags.request(`/${tagId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(data.data[0].name).toBe(dummyTags.name)
  })

  it('should update a tag', async () => {
    const res = await tags.request(`/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: dummyTags.newName
      })
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(data.data[0].name).toBe(dummyTags.newName)
  })

  it('should delete a tag', async () => {
    const res = await tags.request(`/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })

})
