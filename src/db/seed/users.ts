import { hash } from '@node-rs/argon2'
import type { dbType as db } from '../index.js'
import data from './data/users.json'
import { usersTable } from '../schema.js'

export const seedUser = async (db: db) => {
  await Promise.all(
    data.map(async (user) => {
      const hashedPassword = await hash(user.password, {
        parallelism: 1,
      })
      await db.insert(usersTable).values({
        name: user.name,
        email: user.email,
        password: hashedPassword
      })
    })
  )
}
