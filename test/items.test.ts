import { describe,beforeAll, it, expect } from "vitest";
import auth from "../src/routes/auth.js";
import items from "../src/routes/items.js";

describe('Items routes', () => {
  let accessToken = ''
  beforeAll( async () => {
    const res = await auth.request('/login', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        email: 'demituhaaan@subur.biz',
        password: 'lihatmukasaya34'
      })
    })
    const data = await res.json()
    accessToken = data.data.accessToken
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

    expect(data.success).toBe(true)
  })
})
