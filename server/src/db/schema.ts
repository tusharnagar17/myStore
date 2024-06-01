import { doublePrecision, integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  product_name: varchar('product_name', { length: 100 }).notNull(),
  product_category: varchar('product_category', { length: 100 }).notNull(),
  product_description: text('product_description').notNull(),
  product_price: doublePrecision('product_price').notNull(),
  product_stock: integer('product_stock').notNull(),
  product_image: text('product_image').notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customer_email: varchar('customer_email', { length: 100 }).notNull(),
  total: doublePrecision('total').default(0),
});

export const order_items = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id')
    .notNull()
    .references(() => orders.id),
  product_id: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  total: doublePrecision('total').default(0),
});

export type InsertProduct = typeof products.$inferInsert;
export type InsertOrder = typeof orders.$inferInsert;
export type InsertOrderItem = typeof order_items.$inferInsert;

export type SelectProduct = typeof products.$inferSelect;
export type SelectOrder = typeof orders.$inferSelect;
export type SelectOrderItem = typeof order_items.$inferSelect;