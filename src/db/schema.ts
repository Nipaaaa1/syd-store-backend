import { integer, pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core"

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  email: varchar('email', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull()
})

export const itemsTable = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').references(() => usersTable.id, { onDelete: 'cascade'}).notNull(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  quantity: integer('quantity').notNull()
})

export const tagsTable = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  owner_id: uuid('owner_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull()
})

export const itemsTagsTable = pgTable('items_tags', {
  item_id: uuid('item_id').references(() => itemsTable.id, { onDelete: 'cascade' }).notNull(),
  tag_id: uuid('tag_id').references(() => tagsTable.id, { onDelete: 'cascade' }).notNull()
}, table => ({
  pk: primaryKey({ columns: [table.item_id, table.tag_id] })
}))
