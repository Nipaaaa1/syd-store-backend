import 'dotenv/config'
import { describe,beforeAll, it, expect, afterAll } from "vitest";
import items from "./items.index.js";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { dateInSeconds } from "../../lib/utils.js";
import { sign } from 'hono/jwt';

describe('Items routes', () => {
  let accessToken = ''
  let itemId = ''
  const dummyItem = {
    name: 'Mie Goreng',
    quantity: 10
  }


  beforeAll(async () => {
    const [ userData ] = await db
      .select()
      .from(usersTable)
      .where(
        eq(usersTable.name, 'Bob Smith')
      )
    const accessPayload = {
      sub: userData.id,
      email: userData.email,
      exp: dateInSeconds(60 * 15)
    }

    accessToken = await sign(accessPayload, process.env.JWT_ACCESS_TOKEN_SECRET as string)

  })

  afterAll(async () => {
    accessToken = ''
    itemId = ''
  })

  it('should return all items', async () => {
    const res = await items.request('/', {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
  })

  it('should create a new item', async () => {
    const res = await items.request('/', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: 'Mie Goreng',
        quantity: 10
      })
    })

    expect(res.status).toBe(200)

    const data = await res.json()
    
    expect(data.success).toBeTruthy()
    expect(data.data.name).toBe(dummyItem.name)
    expect(data.data.quantity).toBe(dummyItem.quantity)
    itemId = data.data.id
  })
  
  it('should get an item from its id', async () => {
    const res = await items.request(`/${itemId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(data.data.name).toBe(dummyItem.name)
    expect(data.data.quantity).toBe(dummyItem.quantity)
  })

  it('should update an item with its id', async () => {
    const res = await items.request(`/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        quantity: 15
      })
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(data.data.name).toBe(dummyItem.name)
    expect(data.data.quantity).toBe(15)
  })

  it('should delete an item with its id', async () => {
    const res = await items.request(`/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    expect(res.status).toBe(200)
    
    const data = await res.json()

    expect(data.success).toBeTruthy()
    expect(data.data.name).toBe(dummyItem.name)
    expect(data.data.quantity).toBe(15)
  })
})
