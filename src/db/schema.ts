import { relations } from "drizzle-orm"
import { integer, pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core"

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  email: varchar('email', { length: 50 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull()
})

export const itemsTable = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').references(() => usersTable.id, { onDelete: 'cascade'}),
  name: varchar('name', { length: 50 }).notNull().unique(),
  quantity: integer('quantity').notNull()
})

export const tagsTable = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique()
})

export const itemsTagsTable = pgTable('items_tags', {
  item_id: uuid('item_id').references(() => itemsTable.id, { onDelete: 'cascade' }).notNull(),
  tag_id: uuid('tag_id').references(() => tagsTable.id, { onDelete: 'cascade' }).notNull()
}, table => ({
  pk: primaryKey({ columns: [table.item_id, table.tag_id] })
}))

export const refreshTokenTable = pgTable('refresh_token', {
  owner_id: uuid('owner_id').references(() => usersTable.id).notNull(),
  token: varchar('token', { length: 255 }).notNull()
}, table => ({
  pk: primaryKey({ columns: [table.owner_id, table.token]})
}))


// Relations

export const usersRelations = relations(usersTable, ({ many }) => ({
  items: many(itemsTable),
  tokens: many(refreshTokenTable)
}))

export const itemsRelations = relations(itemsTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [itemsTable.owner_id],
    references: [usersTable.id]
  }),
  items_tags: many(itemsTagsTable)
}))

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  items_tags: many(itemsTagsTable)
}))

export const itemsTagsRelations = relations(itemsTagsTable, ({ one }) => ({
  item: one(itemsTable, {
    fields: [itemsTagsTable.item_id],
    references: [itemsTable.id]
  }),
  tag: one(tagsTable, {
    fields: [itemsTagsTable.item_id],
    references: [tagsTable.id]
  })
}))

export const refreshToketRelations = relations(refreshTokenTable, ({ one }) => ({
  owner: one(usersTable, {
    fields: [refreshTokenTable.owner_id],
    references: [usersTable.id]
  })
}))
