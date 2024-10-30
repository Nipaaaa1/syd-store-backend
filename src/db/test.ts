import { db } from './index.ts'
import { itemsTable, usersTable } from './schema.js'


const main = async () => {
  await db.insert(usersTable).values({
    name: "Devan",
    password_hash: "kcteceor"
  })
}

const imain = async () => {
  await db.insert(itemsTable).values({
    owner_id: 'a301f3df-45d9-409b-af26-b1ad7f0d5959',
    name: 'Mie goreng',
    quantity: 10
  })
}

const gmain = async () => {
  const user = await db.query.usersTable.findMany({
    with: {
      items: {
        columns: {
          name: true,
          quantity: true
        },

        with: {
          items_tags: true
        }
      }
    }
  })
  console.log(user)
}

gmain()
